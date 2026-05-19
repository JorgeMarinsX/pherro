import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateLeadDto } from './dto/create-lead.dto'
import { ListLeadsDto } from './dto/list-leads.dto'
import { LeadsService } from './leads.service'

@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto)
  }

  @Get()
  list(@Query() q: ListLeadsDto) {
    return this.service.list(q)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}
