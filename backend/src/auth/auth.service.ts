import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { UsersService } from '../users/users.service'
import { SUPERUSER } from './roles'
import type { AuthUser, JwtPayload } from './types'

// Dummy hash used for timing-safety on unknown emails.
// Real argon2id hash of "dummy-password" — verify always fails but costs same as real.
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$ZG93bnRpbWUtaXMtZmluZQ$Vw5w6PuKzKuNlhmW+I9c5wT5pIH8e1SqxArvuQHKa1c'

type EnvAdmin = { email: string; hash: string } | null

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name)
  private envAdmin: EnvAdmin = null

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')
    const pw = this.config.get<string>('ADMIN_PASSWORD')
    if (email && pw) {
      this.envAdmin = {
        email: email.toLowerCase(),
        hash: await UsersService.hash(pw),
      }
      this.logger.log(`Env superuser registered: ${email}`)
    } else {
      this.logger.warn('No env superuser (ADMIN_EMAIL/ADMIN_PASSWORD unset)')
    }
  }

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const normalized = email.toLowerCase()

    if (this.envAdmin && normalized === this.envAdmin.email) {
      const ok = await argon2.verify(this.envAdmin.hash, password).catch(() => false)
      if (!ok) return null
      return {
        sub: 'env-admin',
        email: normalized,
        role: SUPERUSER,
        isEnvAdmin: true,
      }
    }

    const user = await this.users.findByEmail(normalized)
    if (!user || !user.isActive) {
      // Constant-time: still run verify to avoid timing leak.
      await argon2.verify(DUMMY_HASH, password).catch(() => false)
      return null
    }
    const ok = await UsersService.verify(user.passwordHash, password)
    if (!ok) return null
    void this.users.touchLastLogin(user.id)
    return {
      sub: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      isEnvAdmin: false,
    }
  }

  async issueTokens(user: AuthUser) {
    const payload: JwtPayload = { sub: user.sub, email: user.email, role: user.role }
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m'
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '7d'
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: accessTtl }),
      this.jwt.signAsync({ ...payload, typ: 'refresh' }, { expiresIn: refreshTtl }),
    ])
    return { accessToken, refreshToken, email: user.email, role: user.role }
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

    if (payload.sub === 'env-admin') {
      if (!this.envAdmin || payload.email !== this.envAdmin.email) {
        throw new UnauthorizedException()
      }
      return this.issueTokens({
        sub: 'env-admin',
        email: this.envAdmin.email,
        role: SUPERUSER,
        isEnvAdmin: true,
      })
    }

    const user = await this.users.findByEmail(payload.email)
    if (!user || !user.isActive || user.id !== payload.sub) {
      throw new UnauthorizedException()
    }
    return this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      isEnvAdmin: false,
    })
  }
}
