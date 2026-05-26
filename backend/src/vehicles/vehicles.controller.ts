import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { ListVehiclesDto } from './dto/list-vehicles.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { VehiclesService } from './vehicles.service'

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Public()
  @Get()
  list(@Query() q: ListVehiclesDto) {
    return this.service.list(q)
  }

  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
