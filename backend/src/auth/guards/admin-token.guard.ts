import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { timingSafeEqual } from 'node:crypto'

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>()
    const provided = req.headers['x-admin-token']
    const expected = this.config.get<string>('BACKEND_ADMIN_TOKEN')

    if (!expected) throw new UnauthorizedException()
    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException()
    }

    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) throw new UnauthorizedException()
    if (!timingSafeEqual(a, b)) throw new UnauthorizedException()
    return true
  }
}
