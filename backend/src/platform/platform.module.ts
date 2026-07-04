import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { PlatformTenantsController } from './platform-tenants.controller'
import { PlatformTenantsService } from './platform-tenants.service'
import { SignupController } from './signup.controller'

@Module({
  imports: [PrismaModule],
  controllers: [PlatformTenantsController, SignupController],
  providers: [PlatformTenantsService],
})
export class PlatformModule {}
