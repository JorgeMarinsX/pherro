import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { TenantContext } from './tenant-context'

// Buckets keyed per tenant+IP: one tenant's traffic can't starve another's quota.
@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = (Array.isArray(req.ips) && req.ips.length ? req.ips[0] : req.ip) ?? 'unknown'
    return `t:${TenantContext.tenantId() ?? 'none'}:${ip}`
  }
}
