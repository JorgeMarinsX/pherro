import { timingSafeEqual } from 'node:crypto'
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SkipThrottle } from '@nestjs/throttler'
import { Public } from '../auth/decorators/public.decorator'
import { AsaasWebhookPayload, BillingService } from './billing.service'

// Asaas → us. Auth = shared token in the `asaas-access-token` header.
// Must answer 2xx fast: 15 consecutive failures pause Asaas' delivery queue.
// Body is intentionally untyped (no DTO) — Asaas payloads vary per event and the
// global ValidationPipe would reject unknown fields.
@Controller('billing/webhooks')
export class AsaasWebhookController {
  private readonly webhookToken: string

  constructor(
    private readonly billing: BillingService,
    config: ConfigService,
  ) {
    this.webhookToken = config.get<string>('ASAAS_WEBHOOK_TOKEN', '')
  }

  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post('asaas')
  async handle(
    @Headers('asaas-access-token') token: string | undefined,
    @Body() body: Record<string, unknown>,
  ): Promise<{ received: boolean }> {
    if (!this.webhookToken || !token || !this.safeEquals(token, this.webhookToken)) {
      throw new UnauthorizedException()
    }
    if (typeof body?.id !== 'string' || typeof body?.event !== 'string') {
      throw new BadRequestException()
    }
    await this.billing.handleWebhookEvent(body as unknown as AsaasWebhookPayload)
    return { received: true }
  }

  private safeEquals(a: string, b: string): boolean {
    const ba = Buffer.from(a)
    const bb = Buffer.from(b)
    return ba.length === bb.length && timingSafeEqual(ba, bb)
  }
}
