import { Module } from '@nestjs/common'
import { ShopConfigController } from './shop-config.controller'
import { ShopConfigService } from './shop-config.service'

@Module({
  controllers: [ShopConfigController],
  providers: [ShopConfigService],
  exports: [ShopConfigService],
})
export class ShopConfigModule {}
