import { Body, Controller, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { Public } from '../auth/decorators/public.decorator'
import { SignupDto } from './dto/signup.dto'
import { PlatformTenantsService } from './platform-tenants.service'

// Public self-service provisioning — the only unauthenticated tenant-create path.
@Controller('platform/signup')
export class SignupController {
  constructor(private readonly service: PlatformTenantsService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post()
  signup(@Body() dto: SignupDto) {
    return this.service.signup(dto)
  }
}
