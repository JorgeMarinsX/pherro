import { BadRequestException, Body, Controller, Delete, Get, Post } from '@nestjs/common'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { CurrentTenant } from '../tenant/current-tenant.decorator'
import { BillingService } from './billing.service'
import { SubscribeDto } from './dto/subscribe.dto'
import { PlanLimitsService } from './plan-limits.service'
import { PLANS } from './plans'

// Tenant-facing billing: read plan catalog + status, subscribe, cancel.
// ADMIN only (tenant owner). Asaas is called backend-side; never from the browser.
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  // Plan limits + current usage — drives quota UI in the admin panel.
  @Get('usage')
  @AdminOnly()
  usage(@CurrentTenant() tenantId: string | null) {
    if (!tenantId) throw new BadRequestException('Tenant não resolvido')
    return this.planLimits.usageSummary()
  }

  @Get('plans')
  @AdminOnly()
  plans() {
    return { plans: Object.values(PLANS) }
  }

  @Get('status')
  @AdminOnly()
  status(@CurrentTenant() tenantId: string | null) {
    if (!tenantId) throw new BadRequestException('Tenant não resolvido')
    return this.billing.getStatus(tenantId)
  }

  @Post('subscribe')
  @AdminOnly()
  subscribe(@CurrentTenant() tenantId: string | null, @Body() dto: SubscribeDto) {
    if (!tenantId) throw new BadRequestException('Tenant não resolvido')
    return this.billing.subscribeTenant(tenantId, dto.planId)
  }

  @Delete('subscription')
  @AdminOnly()
  cancel(@CurrentTenant() tenantId: string | null) {
    if (!tenantId) throw new BadRequestException('Tenant não resolvido')
    return this.billing.cancelSubscription(tenantId)
  }
}
