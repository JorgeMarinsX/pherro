import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { timingSafeEqual } from 'node:crypto'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { ADMIN_ROLES, SUPERUSER, type AuthRole } from '../roles'
import type { AuthUser } from '../types'

@Injectable()
export class AdminOrTokenGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined>; user?: AuthUser }>()

    if (req.user) {
      const required =
        this.reflector.getAllAndOverride<AuthRole[]>(ROLES_KEY, [
          ctx.getHandler(),
          ctx.getClass(),
        ]) ?? [...ADMIN_ROLES]
      if (required.includes(req.user.role)) return true
    }

    const provided = req.headers['x-admin-token']
    const expected = this.config.get<string>('BACKEND_ADMIN_TOKEN')
    if (
      expected &&
      typeof provided === 'string' &&
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    ) {
      req.user = {
        sub: 'service-token',
        email: 'service@internal',
        role: SUPERUSER,
        isEnvAdmin: false,
      }
      return true
    }

    throw new UnauthorizedException()
  }
}
