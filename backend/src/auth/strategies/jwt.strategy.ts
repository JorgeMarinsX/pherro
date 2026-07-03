import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { TenantContext } from '../../tenant/tenant-context'
import { UsersService } from '../../users/users.service'
import { PLATFORM_ADMIN } from '../roles'
import type { AuthUser, JwtPayload } from '../types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    const secret = config.get<string>('JWT_SECRET')
    if (!secret) throw new Error('JWT_SECRET not configured')
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.typ === 'refresh') {
      throw new UnauthorizedException('Refresh token not accepted here')
    }

    if (payload.role === PLATFORM_ADMIN) {
      const admin = await this.users.findPlatformAdminById(payload.sub)
      if (!admin || !admin.isActive) throw new UnauthorizedException()
      TenantContext.setPlatformAdmin(true)
      TenantContext.setTenantId(null)
      return {
        sub: admin.id,
        email: admin.email,
        role: PLATFORM_ADMIN,
        tenantId: null,
        isPlatformAdmin: true,
      }
    }

    // Fail closed: tenant tokens only work where the request context resolves
    // to the SAME tenant — unknown/platform hosts reject, not just mismatches.
    const hostTenant = TenantContext.tenantId()
    if (!payload.tenantId || hostTenant !== payload.tenantId) {
      throw new UnauthorizedException()
    }

    const user = await this.users.findByIdInTenant(payload.sub, payload.tenantId)
    if (!user || !user.isActive || user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException()
    }

    TenantContext.setTenantId(payload.tenantId)
    return {
      sub: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      tenantId: user.tenantId,
      isPlatformAdmin: false,
    }
  }
}
