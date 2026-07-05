import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { ActiveTenantGuard } from '../tenant/active-tenant.guard'
import { ShopConfigService } from './shop-config.service'
import { UpdateShopConfigDto } from './dto/update-shop-config.dto'

@Controller('shop-config')
export class ShopConfigController {
  constructor(private readonly service: ShopConfigService) {}

  @Public()
  @UseGuards(ActiveTenantGuard)
  @Get()
  get() {
    return this.service.get()
  }

  @Patch()
  @AdminOnly()
  update(@Body() dto: UpdateShopConfigDto) {
    return this.service.update(dto)
  }
}
