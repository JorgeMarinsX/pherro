import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { BillingModule } from '../billing/billing.module'
import { EmailModule } from '../email/email.module'
import { PrismaModule } from '../prisma/prisma.module'
import { DemoController } from './demo.controller'
import { DemoService } from './demo.service'
import { PlatformTenantsController } from './platform-tenants.controller'
import { PlatformTenantsService } from './platform-tenants.service'
import { SignupController } from './signup.controller'

@Module({
  imports: [PrismaModule, BillingModule, AuthModule, EmailModule],
  controllers: [PlatformTenantsController, SignupController, DemoController],
  providers: [PlatformTenantsService, DemoService],
})
export class PlatformModule {}
