import { Module } from '@nestjs/common'
import { BillingModule } from '../billing/billing.module'
import { EmailModule } from '../email/email.module'
import { LeadsController } from './leads.controller'
import { LeadsService } from './leads.service'

@Module({
  imports: [BillingModule, EmailModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
