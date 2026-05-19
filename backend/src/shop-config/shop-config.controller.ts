import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ShopConfigService } from './shop-config.service'
import { UpdateShopConfigDto } from './dto/update-shop-config.dto'

@Controller('shop-config')
export class ShopConfigController {
  constructor(private readonly service: ShopConfigService) {}

  @Get()
  get() {
    return this.service.get()
  }

  @Patch()
  update(@Body() dto: UpdateShopConfigDto) {
    return this.service.update(dto)
  }
}
