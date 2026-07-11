import { Module } from '@nestjs/common'
import { BillingModule } from '../billing/billing.module'
import { ShopConfigModule } from '../shop-config/shop-config.module'
import { UploadsController } from './uploads.controller'
import { UploadsService } from './uploads.service'

@Module({
  imports: [ShopConfigModule, BillingModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
