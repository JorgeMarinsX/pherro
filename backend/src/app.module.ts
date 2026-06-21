import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AttributesModule } from './attributes/attributes.module'
import { AuthModule } from './auth/auth.module'
import { LeadsModule } from './leads/leads.module'
import { PrismaModule } from './prisma/prisma.module'
import { ShopConfigModule } from './shop-config/shop-config.module'
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
    UsersModule,
    AuthModule,
    ShopConfigModule,
    VehiclesModule,
    WhatsappNumbersModule,
    AttributesModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
