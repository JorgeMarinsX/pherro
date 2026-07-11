import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { jwtModuleOptions } from '../auth/jwt.options'
import { ActiveTenantGuard } from './active-tenant.guard'
import { TenantResolverService } from './tenant-resolver.service'

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: jwtModuleOptions,
    }),
  ],
  providers: [TenantResolverService, ActiveTenantGuard],
  // Export JwtModule so ActiveTenantGuard resolves JwtService when instantiated by
  // @UseGuards in any consuming module (this module is @Global).
  exports: [TenantResolverService, ActiveTenantGuard, JwtModule],
})
export class TenantModule {}
