import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { ActiveTenantGuard } from '../tenant/active-tenant.guard'
import { CreateLeadDto } from './dto/create-lead.dto'
import { ListLeadsDto } from './dto/list-leads.dto'
import { LeadsService } from './leads.service'

@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Public()
  @UseGuards(ActiveTenantGuard)
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto)
  }

  @Get()
  @AdminOnly()
  list(@Query() q: ListLeadsDto) {
    return this.service.list(q)
  }

  @Get(':id')
  @AdminOnly()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}
