import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'node:crypto'
import type Redis from 'ioredis'
import { REDIS } from '../redis/redis.module'

// Per-email failure lockout, independent of the per-IP throttle: rotating IPs
// no longer buys unlimited guesses against one account. Callers must keep the
// locked response identical to a plain bad-password 401 (no enumeration).
@Injectable()
export class LockoutService {
  private readonly max: number
  private readonly windowMs: number

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.max = Number(config.get('AUTH_LOCKOUT_MAX') ?? 10)
    this.windowMs = Number(config.get('AUTH_LOCKOUT_WINDOW_MS') ?? 15 * 60_000)
  }

  // Hashed key: raw e-mail addresses never land in Redis.
  private key(scope: string, email: string) {
    const h = createHash('sha256').update(`${scope}:${email}`).digest('hex').slice(0, 32)
    return `auth:lock:${h}`
  }

  async isLocked(scope: string, email: string): Promise<boolean> {
    const n = await this.redis.get(this.key(scope, email))
    return n !== null && Number(n) >= this.max
  }

  async registerFailure(scope: string, email: string): Promise<void> {
    const key = this.key(scope, email)
    await this.redis.incr(key)
    await this.redis.pexpire(key, this.windowMs)
  }

  async clear(scope: string, email: string): Promise<void> {
    await this.redis.del(this.key(scope, email))
  }
}
