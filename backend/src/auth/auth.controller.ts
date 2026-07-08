import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import { Public } from './decorators/public.decorator'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { LoginDto } from './dto/login.dto'
import { LogoutDto } from './dto/logout.dto'
import { RefreshDto } from './dto/refresh.dto'
import type { AuthUser } from './types'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Req() req: { user: AuthUser }, @Body() _dto: LoginDto) {
    return this.auth.issueTokens(req.user)
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: LogoutDto) {
    if (dto.refreshToken) await this.auth.revokeRefreshToken(dto.refreshToken)
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { email: user.email, role: user.role }
  }
}
