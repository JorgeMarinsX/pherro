import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../../prisma/prisma.service'
import type { AuthUser, JwtPayload } from '../types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
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
    if (payload.sub === 'env-admin') {
      return {
        sub: 'env-admin',
        email: payload.email,
        role: 'SUPERUSER',
        isEnvAdmin: true,
      }
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) throw new UnauthorizedException()
    return {
      sub: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      isEnvAdmin: false,
    }
  }
}
