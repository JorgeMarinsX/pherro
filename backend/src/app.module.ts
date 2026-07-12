import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import { CacheModule } from '@nestjs/cache-manager'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import type Redis from 'ioredis'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AttributesModule } from './attributes/attributes.module'
import { AuthModule } from './auth/auth.module'
import { BillingModule } from './billing/billing.module'
import { CampaignsModule } from './campaigns/campaigns.module'
import { EmailModule } from './email/email.module'
import { LeadsModule } from './leads/leads.module'
import { PlatformModule } from './platform/platform.module'
import { PrismaModule } from './prisma/prisma.module'
import { REDIS, RedisModule } from './redis/redis.module'
import { ShopConfigModule } from './shop-config/shop-config.module'
import { StorageModule } from './storage/storage.module'
import { RequestLoggingInterceptor } from './tenant/request-logging.interceptor'
import { TenantMiddleware } from './tenant/tenant.middleware'
import { TenantThrottlerGuard } from './tenant/tenant-throttler.guard'
import { TenantModule } from './tenant/tenant.module'
import { UploadsModule } from './uploads/uploads.module'
import { UsersModule } from './users/users.module'
import { VehiclesModule } from './vehicles/vehicles.module'
import { WhatsappNumbersModule } from './whatsapp-numbers/whatsapp-numbers.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule.register({ isGlobal: true, ttl: 60_000, max: 500 }),
    RedisModule,
    // Redis-backed counters: survive restarts, shared if we ever run replicas.
    ThrottlerModule.forRootAsync({
      inject: [REDIS],
      useFactory: (redis: Redis) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 60 }],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    PrismaModule,
    StorageModule,
    UploadsModule,
    BillingModule,
    TenantModule,
    UsersModule,
    AuthModule,
    ShopConfigModule,
    VehiclesModule,
    WhatsappNumbersModule,
    AttributesModule,
    LeadsModule,
    EmailModule,
    CampaignsModule,
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
