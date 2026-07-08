import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { TenantContext } from '../tenant/tenant-context'
import { UsersService } from '../users/users.service'
import { LockoutService } from './lockout.service'
import { RefreshTokenService } from './refresh-token.service'
import type { AuthUser, JwtPayload } from './types'
import { isPlatformAdminRole } from './roles'

// Real argon2id hash of "dummy-password" — verify always fails, same cost as real.
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$ZG93bnRpbWUtaXMtZmluZQ$Vw5w6PuKzKuNlhmW+I9c5wT5pIH8e1SqxArvuQHKa1c'

const TTL_UNITS: Record<string, number> = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }

function ttlToMs(ttl: string): number {
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(ttl.trim())
  if (!m) throw new Error(`Invalid TTL format: ${ttl}`)
  return Number(m[1]) * TTL_UNITS[m[2] ?? 'ms']
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly lockout: LockoutService,
  ) {}

  private refreshTtl() {
    return this.config.get<string>('JWT_REFRESH_TTL') ?? '7d'
  }

  // Tenant resolved from the host (TenantContext, set by middleware).
  // Null tenant = platform host → only a PLATFORM_ADMIN may log in there.
  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const normalized = email.toLowerCase()
    const tenantId = TenantContext.tenantId()
    const lockScope = tenantId ?? 'platform'

    // Locked account: same dummy-verify cost and same null as a bad password —
    // the response never reveals the lockout.
    if (await this.lockout.isLocked(lockScope, normalized)) {
      await argon2.verify(DUMMY_HASH, password).catch(() => false)
      return null
    }

    const user = tenantId
      ? await this.users.findByEmailInTenant(normalized, tenantId)
      : await this.users.findPlatformAdminByEmail(normalized)

    if (!user || !user.isActive) {
      await argon2.verify(DUMMY_HASH, password).catch(() => false)
      await this.lockout.registerFailure(lockScope, normalized)
      return null
    }
    const ok = await UsersService.verify(user.passwordHash, password)
    if (!ok) {
      await this.lockout.registerFailure(lockScope, normalized)
      return null
    }
    await this.lockout.clear(lockScope, normalized)
    if (user.tenantId) void this.users.touchLastLogin(user.id, user.tenantId)
    else void this.users.touchPlatformAdminLastLogin(user.id)
    return this.toAuthUser(user)
  }

  // `rotated` present = refresh path (family already rotated); absent = fresh login.
  async issueTokens(user: AuthUser, rotated?: { fid: string; jti: string }) {
    const payload: JwtPayload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    }
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m'
    const refreshTtl = this.refreshTtl()
    const { fid, jti } = rotated ?? (await this.refreshTokens.createFamily(ttlToMs(refreshTtl)))
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: accessTtl }),
      this.jwt.signAsync({ ...payload, typ: 'refresh', fid, jti }, { expiresIn: refreshTtl }),
    ])
    return { accessToken, refreshToken, email: user.email, role: user.role, tenantId: user.tenantId }
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken)
    } catch {
      throw new UnauthorizedException('Refresh token inválido')
    }
    if (payload.typ !== 'refresh' || !payload.fid || !payload.jti) {
      throw new UnauthorizedException('Token não é refresh')
    }

    const user = isPlatformAdminRole(payload.role)
      ? await this.users.findPlatformAdminById(payload.sub)
      : await this.users.findByIdInTenant(payload.sub, payload.tenantId)

    if (!user || !user.isActive || user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException()
    }
    const jti = await this.refreshTokens.rotate(payload.fid, payload.jti, ttlToMs(this.refreshTtl()))
    return this.issueTokens(this.toAuthUser(user), { fid: payload.fid, jti })
  }

  // Best-effort logout revocation: garbage/expired tokens have nothing to revoke.
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken)
      if (payload.typ === 'refresh' && payload.fid) {
        await this.refreshTokens.revoke(payload.fid)
      }
    } catch {
      return
    }
  }

  private toAuthUser(user: {
    id: string
    email: string
    role: AuthUser['role']
    tenantId: string | null
  }): AuthUser {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isPlatformAdmin: isPlatformAdminRole(user.role),
    }
  }
}
