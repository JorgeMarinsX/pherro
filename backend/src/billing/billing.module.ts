import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AsaasService } from './asaas.service'
import { AsaasWebhookController } from './asaas-webhook.controller'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'
import { PlanLimitsService } from './plan-limits.service'

@Module({
  imports: [PrismaModule],
  controllers: [AsaasWebhookController, BillingController],
  providers: [AsaasService, BillingService, PlanLimitsService],
  exports: [AsaasService, BillingService, PlanLimitsService],
})
export class BillingModule {}
