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
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { ListVehiclesDto } from './dto/list-vehicles.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { VehiclesService } from './vehicles.service'

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  list(@Query() q: ListVehiclesDto) {
    return this.service.list(q)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
