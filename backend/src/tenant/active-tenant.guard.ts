import { timingSafeEqual } from 'node:crypto'
import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { JwtPayload } from '../auth/types'
import { TenantContext } from './tenant-context'

// Storefront gate for PENDING_PAYMENT tenants: keep the public site dark until the first
// invoice is paid, WITHOUT breaking the admin panel — which reuses these same @Public read
// routes through authenticated BFF proxies.
//
// These are @Public routes, so the global JwtAuthGuard never runs and req.user is unset.
// We therefore verify the caller here explicitly: access to a pending store's public reads
// is allowed ONLY for a cryptographically valid tenant JWT bound to THIS resolved tenant,
// or the S2S admin token. Anonymous or invalid/mismatched tokens get a 404 (dark store).
// Below the tenant middleware a paid tenant is an ordinary tenant (RLS still scopes rows).
@Injectable()
export class ActiveTenantGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (TenantContext.status() !== 'PENDING_PAYMENT') return true

    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>()

    if (this.hasValidAdminToken(req.headers) || (await this.hasValidTenantBearer(req.headers))) {
      return true
    }
    throw new NotFoundException('Loja indisponível')
  }

  // S2S service token: authenticates as this-tenant admin; still scoped by the middleware.
  private hasValidAdminToken(headers: Record<string, string | string[] | undefined>): boolean {
    const provided = headers['x-admin-token']
    const expected = this.config.get<string>('BACKEND_ADMIN_TOKEN')
    return (
      !!expected &&
      typeof provided === 'string' &&
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    )
  }

  // Valid access JWT whose tenant matches the tenant resolved for this request.
  private async hasValidTenantBearer(
    headers: Record<string, string | string[] | undefined>,
  ): Promise<boolean> {
    const auth = headers['authorization']
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return false
    const token = auth.slice(7)

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token)
      if (payload.typ === 'refresh') return false
      return !!payload.tenantId && payload.tenantId === TenantContext.tenantId()
    } catch {
      return false
    }
  }
}
