import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { TestSendDto } from '../email/dto/test-send.dto'
import { CampaignsService } from './campaigns.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'

@Controller('campaigns')
@AdminOnly()
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Get('recipients-preview')
  recipientsPreview() {
    return this.service.recipientsPreview()
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.service.create(dto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.service.remove(id)
  }

  @Post(':id/test')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  sendTest(@Param('id') id: string, @Body() dto: TestSendDto) {
    return this.service.sendTest(id, dto.to)
  }

  @Post(':id/send')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  send(@Param('id') id: string) {
    return this.service.send(id)
  }
}
