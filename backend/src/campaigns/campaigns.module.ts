import { Module } from '@nestjs/common'
import { BillingModule } from '../billing/billing.module'
import { EmailModule } from '../email/email.module'
import { PrismaModule } from '../prisma/prisma.module'
import { CampaignsController } from './campaigns.controller'
import { CampaignsService } from './campaigns.service'

@Module({
  imports: [BillingModule, PrismaModule, EmailModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
