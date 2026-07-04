import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

// Raised for non-2xx responses so callers can decide fatal vs best-effort.
export class ResendApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Resend API error ${status}`)
  }
}

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface SendEmailResult {
  id: string
}

// Resend batch limit per request (https://resend.com/docs/api-reference/emails/send-batch-emails).
export const RESEND_BATCH_LIMIT = 100

// Thin HTTP client for the Resend REST API (https://resend.com/docs/api-reference).
// Auth = `Authorization: Bearer <key>`. Unconfigured (no key) is a supported state:
// callers must check `isConfigured` and skip e-mail side-effects.
@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name)
  private readonly apiKey: string
  private readonly baseUrl: string
  readonly defaultFrom: string

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY', '')
    this.baseUrl = (config.get<string>('RESEND_BASE_URL') || 'https://api.resend.com')
      .replace(/\/+$/, '')
    // onboarding@resend.dev works without domain verification (delivers to own inbox only).
    this.defaultFrom = config.get<string>('RESEND_FROM', 'Pherro <onboarding@resend.dev>')
    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY not set — e-mail sends will be skipped')
    }
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0
  }

  sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    return this.request<SendEmailResult>('POST', '/emails', this.payload(input))
  }

  // Up to RESEND_BATCH_LIMIT e-mails per call — chunking is the caller's job.
  sendBatch(items: SendEmailInput[]): Promise<{ data: SendEmailResult[] }> {
    return this.request<{ data: SendEmailResult[] }>(
      'POST',
      '/emails/batch',
      items.map((i) => this.payload(i)),
    )
  }

  private payload(input: SendEmailInput) {
    return {
      from: input.from ?? this.defaultFrom,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.isConfigured) {
      throw new ResendApiError(0, 'RESEND_API_KEY not configured')
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    const json: unknown = text ? JSON.parse(text) : null
    if (!res.ok) {
      this.logger.error(`Resend ${method} ${path} → ${res.status}: ${text.slice(0, 500)}`)
      throw new ResendApiError(res.status, json)
    }
    return json as T
  }
}
