import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { TenantContext } from './tenant-context'

// Storefront gate for PENDING_PAYMENT tenants: keep the public site dark until the first
// invoice is paid, WITHOUT breaking the admin panel — which reuses these same @Public read
// routes through authenticated BFF proxies. The panel's proxied calls carry a tenant bearer
// (or the S2S admin token); anonymous storefront visitors carry neither. So we only block
// the anonymous case. Below the tenant middleware, a paid tenant is an ordinary tenant.
@Injectable()
export class ActiveTenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    if (TenantContext.status() !== 'PENDING_PAYMENT') return true

    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>()
    const hasAuth = !!req.headers['authorization'] || !!req.headers['x-admin-token']
    if (hasAuth) return true // authenticated admin/S2S — allowed to manage a pending store

    throw new NotFoundException('Loja indisponível')
  }
}
