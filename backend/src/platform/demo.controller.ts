import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { Public } from '../auth/decorators/public.decorator'
import { AdminTokenGuard } from '../auth/guards/admin-token.guard'
import { DemoService } from './demo.service'
import { DemoSessionDto } from './dto/demo-session.dto'

// S2S only (X-Admin-Token): the Nuxt BFF bootstraps a demo session per visitor.
// Browsers never reach this — the tenantId in the body comes from the BFF's
// signed cookie, and is still re-validated as a real demo tenant here.
@Controller('platform/demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Public()
  @UseGuards(AdminTokenGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(200)
  async session(@Body() dto: DemoSessionDto) {
    if (dto.tenantId) {
      const existing = await this.demo.reissue(dto.tenantId)
      if (existing) return existing
    }
    return this.demo.create()
  }
}
