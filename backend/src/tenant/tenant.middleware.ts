import { Injectable, NestMiddleware } from '@nestjs/common'
import { TenantContext } from './tenant-context'
import { TenantResolverService } from './tenant-resolver.service'

type Req = {
  headers: Record<string, string | string[] | undefined>
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly resolver: TenantResolverService) {}

  async use(req: Req, _res: unknown, next: () => void): Promise<void> {
    const tenantId = await this.resolve(req)
    // enterWith, not run(): with Fastify/middie the handler runs outside next()'s scope.
    TenantContext.enterWith({ tenantId, isPlatformAdmin: false, inTenantTx: false })
    next()
  }

  private async resolve(req: Req): Promise<string | null> {
    // S2S/dev escape hatch — still validated (must exist + be ACTIVE).
    const headerId = this.header(req, 'x-tenant-id')
    const tenant = headerId
      ? await this.resolver.resolveById(headerId)
      : await this.resolveFromHost(req)
    if (!tenant || tenant.status !== 'ACTIVE') return null
    return tenant.id
  }

  private async resolveFromHost(req: Req) {
    const host = this.header(req, 'x-forwarded-host') ?? this.header(req, 'host')
    if (!host) return null
    return this.resolver.resolveByHost(host)
  }

  private header(req: Req, name: string): string | null {
    const v = req.headers[name]
    return typeof v === 'string' && v.length > 0 ? v : null
  }
}
