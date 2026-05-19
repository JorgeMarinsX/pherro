import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LeadsModule } from './leads/leads.module'
import { PrismaModule } from './prisma/prisma.module'
import { ShopConfigModule } from './shop-config/shop-config.module'
import { VehiclesModule } from './vehicles/vehicles.module'

@Module({
  imports: [
    CacheModule.register({ isGlobal: true, ttl: 60_000, max: 500 }),
    PrismaModule,
    ShopConfigModule,
    VehiclesModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
