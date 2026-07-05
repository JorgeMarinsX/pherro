import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ActiveTenantGuard } from './active-tenant.guard'
import { TenantResolverService } from './tenant-resolver.service'

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')
        if (!secret) throw new Error('JWT_SECRET not configured')
        return { secret, signOptions: { algorithm: 'HS256' } }
      },
    }),
  ],
  providers: [TenantResolverService, ActiveTenantGuard],
  // Export JwtModule so ActiveTenantGuard resolves JwtService when instantiated by
  // @UseGuards in any consuming module (this module is @Global).
  exports: [TenantResolverService, ActiveTenantGuard, JwtModule],
})
export class TenantModule {}
