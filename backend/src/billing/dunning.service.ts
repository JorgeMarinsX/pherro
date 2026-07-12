import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { tenantUrl } from '../email/tenant-urls'
import { PrismaService } from '../prisma/prisma.service'
import { TenantResolverService } from '../tenant/tenant-resolver.service'
import { BillingService } from './billing.service'
import { billingGraceDays } from './dunning.config'

// Grace-window sweep: tenants overdue past BILLING_GRACE_DAYS get suspended.
// Reactivation is webhook-driven (paid invoice → ACTIVE, see BillingService).
@Injectable()
export class DunningService {
  private readonly logger = new Logger(DunningService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: TenantResolverService,
    private readonly billing: BillingService,
  ) {}

  // 08:00 UTC = early morning BRT, before business hours.
  @Cron('0 0 8 * * *')
  async sweep(): Promise<void> {
    const cutoff = new Date(Date.now() - billingGraceDays() * 24 * 60 * 60 * 1000)
    const expired = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', overdueSince: { lte: cutoff } },
      select: { id: true, slug: true, name: true, customDomain: true, asaasSubscriptionId: true },
    })
    if (expired.length === 0) return

    for (const tenant of expired) {
      try {
        await this.prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'SUSPENDED' } })
        await this.resolver.invalidateTenant(tenant)
        this.logger.warn(`Tenant ${tenant.slug}: suspended after grace period`)
        const invoiceUrl = await this.billing.latestInvoiceUrl(tenant.asaasSubscriptionId)
        await this.billing.notifyAdmins(tenant.id, 'account_suspended', {
          SHOP_NAME: tenant.name,
          PAY_URL: invoiceUrl || tenantUrl(tenant.slug, '/admin/plano'),
        })
      } catch (e) {
        this.logger.error(`Dunning suspension failed for tenant ${tenant.slug}`, e as Error)
      }
    }
  }
}
