import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { PLATFORM_ADMIN } from '../auth/roles'
import { TestSendDto } from './dto/test-send.dto'
import { UpdateTemplateDto } from './dto/update-template.dto'
import { EmailTemplatesService } from './email-templates.service'

// Cross-tenant surface: transactional templates are platform-wide.
@Controller('platform/email-templates')
@Roles(PLATFORM_ADMIN)
export class EmailTemplatesController {
  constructor(private readonly service: EmailTemplatesService) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.service.get(key)
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateTemplateDto) {
    return this.service.update(key, dto)
  }

  @Post(':key/test')
  sendTest(@Param('key') key: string, @Body() dto: TestSendDto) {
    return this.service.sendTest(key, dto.to)
  }
}
