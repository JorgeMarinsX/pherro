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
    const resolved = await this.resolve(req)
    // enterWith, not run(): with Fastify/middie the handler runs outside next()'s scope.
    // PENDING_PAYMENT tenants keep a context so their admin can log in and pay; the
    // public storefront is blocked separately by ActiveTenantGuard. SUSPENDED stays dark.
    TenantContext.enterWith({
      tenantId: resolved?.id ?? null,
      status: resolved?.status ?? null,
      isPlatformAdmin: false,
      inTenantTx: false,
    })
    next()
  }

  private async resolve(req: Req): Promise<{ id: string; status: 'ACTIVE' | 'PENDING_PAYMENT' } | null> {
    // S2S/dev escape hatch — still validated (must exist).
    const headerId = this.header(req, 'x-tenant-id')
    const tenant = headerId
      ? await this.resolver.resolveById(headerId)
      : await this.resolveFromHost(req)
    // ACTIVE + PENDING_PAYMENT resolve; SUSPENDED (and unknown) get no context.
    if (!tenant || (tenant.status !== 'ACTIVE' && tenant.status !== 'PENDING_PAYMENT')) return null
    return { id: tenant.id, status: tenant.status }
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
