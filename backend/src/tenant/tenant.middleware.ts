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
    TenantContext.run({ tenantId, isPlatformAdmin: false }, () => next())
  }

  private async resolve(req: Req): Promise<string | null> {
    const headerId = this.header(req, 'x-tenant-id')
    if (headerId) return headerId

    const host = this.header(req, 'x-forwarded-host') ?? this.header(req, 'host')
    if (!host) return null

    const tenant = await this.resolver.resolveByHost(host)
    if (!tenant || tenant.status !== 'ACTIVE') return null
    return tenant.id
  }

  private header(req: Req, name: string): string | null {
    const v = req.headers[name]
    return typeof v === 'string' && v.length > 0 ? v : null
  }
}
