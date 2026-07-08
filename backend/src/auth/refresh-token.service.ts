import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type Redis from 'ioredis'
import { REDIS } from '../redis/redis.module'

// One Redis key per token family, holding the ONLY jti currently allowed to
// refresh. A presented jti that exists-but-mismatches means it was already
// rotated → stolen-token replay → the whole family is revoked atomically.
const ROTATE_LUA = `
local cur = redis.call('GET', KEYS[1])
if not cur then return -1 end
if cur ~= ARGV[1] then
  redis.call('DEL', KEYS[1])
  return -2
end
redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
return 1
`

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name)

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private key(fid: string) {
    return `auth:rtfam:${fid}`
  }

  async createFamily(ttlMs: number): Promise<{ fid: string; jti: string }> {
    const fid = randomUUID()
    const jti = randomUUID()
    await this.redis.set(this.key(fid), jti, 'PX', ttlMs)
    return { fid, jti }
  }

  // Returns the next jti; throws 401 on expired/revoked family or on reuse.
  async rotate(fid: string, jti: string, ttlMs: number): Promise<string> {
    const next = randomUUID()
    const res = await this.redis.eval(ROTATE_LUA, 1, this.key(fid), jti, next, String(ttlMs))
    if (res === -2) {
      this.logger.warn(`Refresh token reuse detected — family ${fid} revoked`)
      throw new UnauthorizedException()
    }
    if (res !== 1) throw new UnauthorizedException()
    return next
  }

  async revoke(fid: string): Promise<void> {
    await this.redis.del(this.key(fid))
  }
}
