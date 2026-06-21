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
import { CreateWhatsappNumberDto } from './dto/create-whatsapp-number.dto'
import { UpdateWhatsappNumberDto } from './dto/update-whatsapp-number.dto'
import { WhatsappNumbersService } from './whatsapp-numbers.service'

@Controller('whatsapp-numbers')
export class WhatsappNumbersController {
  constructor(private readonly service: WhatsappNumbersService) {}

  @Public()
  @Get()
  list() {
    return this.service.list()
  }

  // Storefront helper reads the single active number from here.
  @Public()
  @Get('active')
  getActive() {
    return this.service.getActive()
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreateWhatsappNumberDto) {
    return this.service.create(dto)
  }

  @Patch(':id/activate')
  @AdminOnly()
  activate(@Param('id') id: string) {
    return this.service.activate(id)
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() dto: UpdateWhatsappNumberDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
