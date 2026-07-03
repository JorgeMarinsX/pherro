import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { TenantContext } from '../tenant/tenant-context'
import { UsersService } from '../users/users.service'
import type { AuthUser, JwtPayload } from './types'
import { isPlatformAdminRole } from './roles'

// Real argon2id hash of "dummy-password" — verify always fails, same cost as real.
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$ZG93bnRpbWUtaXMtZmluZQ$Vw5w6PuKzKuNlhmW+I9c5wT5pIH8e1SqxArvuQHKa1c'

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  // Tenant resolved from the host (TenantContext, set by middleware).
  // Null tenant = platform host → only a PLATFORM_ADMIN may log in there.
  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const normalized = email.toLowerCase()
    const tenantId = TenantContext.tenantId()

    const user = tenantId
      ? await this.users.findByEmailInTenant(normalized, tenantId)
      : await this.users.findPlatformAdminByEmail(normalized)

    if (!user || !user.isActive) {
      await argon2.verify(DUMMY_HASH, password).catch(() => false)
      return null
    }
    const ok = await UsersService.verify(user.passwordHash, password)
    if (!ok) return null
    if (user.tenantId) void this.users.touchLastLogin(user.id, user.tenantId)
    else void this.users.touchPlatformAdminLastLogin(user.id)
    return this.toAuthUser(user)
  }

  async issueTokens(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    }
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m'
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '7d'
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: accessTtl }),
      this.jwt.signAsync({ ...payload, typ: 'refresh' }, { expiresIn: refreshTtl }),
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
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Token não é refresh')
    }

    const user = isPlatformAdminRole(payload.role)
      ? await this.users.findPlatformAdminById(payload.sub)
      : await this.users.findByIdInTenant(payload.sub, payload.tenantId)

    if (!user || !user.isActive || user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException()
    }
    return this.issueTokens(this.toAuthUser(user))
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
