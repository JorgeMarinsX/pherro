import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AsaasService } from './asaas.service'
import { AsaasWebhookController } from './asaas-webhook.controller'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'

@Module({
  imports: [PrismaModule],
  controllers: [AsaasWebhookController, BillingController],
  providers: [AsaasService, BillingService],
  exports: [AsaasService, BillingService],
})
export class BillingModule {}
