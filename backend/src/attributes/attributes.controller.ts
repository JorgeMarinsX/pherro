import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { AttributesService } from './attributes.service'
import { CreateAttributeDto } from './dto/create-attribute.dto'
import { UpdateAttributeDto } from './dto/update-attribute.dto'

@Controller('attributes')
export class AttributesController {
  constructor(private readonly service: AttributesService) {}

  // Public — storefront needs name/icon to render vehicle specs.
  @Public()
  @Get()
  list() {
    return this.service.list()
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateAttributeDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
