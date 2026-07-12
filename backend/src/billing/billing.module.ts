import { Module } from '@nestjs/common'
import { EmailModule } from '../email/email.module'
import { PrismaModule } from '../prisma/prisma.module'
import { AsaasService } from './asaas.service'
import { AsaasWebhookController } from './asaas-webhook.controller'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'
import { DunningService } from './dunning.service'
import { PlanLimitsService } from './plan-limits.service'

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AsaasWebhookController, BillingController],
  providers: [AsaasService, BillingService, DunningService, PlanLimitsService],
  exports: [AsaasService, BillingService, PlanLimitsService],
})
export class BillingModule {}
