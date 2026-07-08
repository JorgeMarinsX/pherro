import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

export const REDIS = Symbol('REDIS')

// Single shared ioredis client. Auth correctness depends on it (refresh
// rotation, lockout, throttle counters) — missing REDIS_URL fails boot.
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL')
        if (!url) throw new Error('REDIS_URL not configured')
        return new Redis(url, { maxRetriesPerRequest: 2 })
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    await this.redis.quit().catch(() => undefined)
  }
}
