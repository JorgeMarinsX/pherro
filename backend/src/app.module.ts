import { CacheModule } from '@nestjs/cache-manager'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AttributesModule } from './attributes/attributes.module'
import { AuthModule } from './auth/auth.module'
import { BillingModule } from './billing/billing.module'
import { LeadsModule } from './leads/leads.module'
import { PlatformModule } from './platform/platform.module'
import { PrismaModule } from './prisma/prisma.module'
import { ShopConfigModule } from './shop-config/shop-config.module'
import { RequestLoggingInterceptor } from './tenant/request-logging.interceptor'
import { TenantMiddleware } from './tenant/tenant.middleware'
import { TenantThrottlerGuard } from './tenant/tenant-throttler.guard'
import { TenantModule } from './tenant/tenant.module'
import { UsersModule } from './users/users.module'
import { VehiclesModule } from './vehicles/vehicles.module'
import { WhatsappNumbersModule } from './whatsapp-numbers/whatsapp-numbers.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: 60_000, max: 500 }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
    ]),
    PrismaModule,
    BillingModule,
    TenantModule,
    UsersModule,
    AuthModule,
    ShopConfigModule,
    VehiclesModule,
    WhatsappNumbersModule,
    AttributesModule,
    LeadsModule,
    PlatformModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantMiddleware,
    { provide: APP_GUARD, useClass: TenantThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*')
  }
}
