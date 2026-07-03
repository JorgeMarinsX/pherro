import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { TenantContext } from './tenant-context'

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{ method: string; url: string; ip?: string }>()
    const start = performance.now()
    const tag = () =>
      `${req.method} ${req.url} ${(performance.now() - start).toFixed(0)}ms ip=${req.ip ?? '-'} tenant=${TenantContext.tenantId() ?? '-'}`

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(tag()),
        error: (err: Error) => this.logger.warn(`${tag()} error=${err.message}`),
      }),
    )
  }
}
