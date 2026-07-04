import { Module } from '@nestjs/common'
import { BillingModule } from '../billing/billing.module'
import { PrismaModule } from '../prisma/prisma.module'
import { PlatformTenantsController } from './platform-tenants.controller'
import { PlatformTenantsService } from './platform-tenants.service'
import { SignupController } from './signup.controller'

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [PlatformTenantsController, SignupController],
  providers: [PlatformTenantsService],
})
export class PlatformModule {}
