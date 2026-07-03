import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { PLATFORM_ADMIN } from '../auth/roles'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { PlatformTenantsService } from './platform-tenants.service'

// Cross-tenant surface: real PLATFORM_ADMIN JWT only — the S2S service token
// deliberately has no access here.
@Controller('platform/tenants')
@Roles(PLATFORM_ADMIN)
export class PlatformTenantsController {
  constructor(private readonly service: PlatformTenantsService) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(id, dto)
  }
}
