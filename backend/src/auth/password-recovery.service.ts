import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash, randomBytes } from 'node:crypto'
import type Redis from 'ioredis'
import { EmailTemplatesService } from '../email/email-templates.service'
import { tenantUrl } from '../email/tenant-urls'
import { PrismaService } from '../prisma/prisma.service'
import { REDIS } from '../redis/redis.module'
import { TenantContext } from '../tenant/tenant-context'
import { UsersService } from '../users/users.service'
import { LockoutService } from './lockout.service'

// Redis-backed single-use reset tokens. Only the sha256 of the token is stored;
// the plaintext exists solely inside the e-mail link. One live token per user —
// requesting again invalidates the previous link.
@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name)
  private readonly ttlMs: number

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly email: EmailTemplatesService,
    private readonly lockout: LockoutService,
    config: ConfigService,
  ) {
    this.ttlMs = Number(config.get('AUTH_RESET_TTL_MS') ?? 3_600_000)
  }

  private tokenKey(hash: string) {
    return `auth:pwreset:${hash}`
  }

  private userKey(userId: string) {
    return `auth:pwreset:user:${userId}`
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  // Never throws and callers must not await-couple the response to it:
  // the endpoint answers 204 regardless, so timing/body never reveal
  // whether the e-mail belongs to an account.
  async request(email: string): Promise<void> {
    try {
      const tenantId = TenantContext.tenantId()
      if (!tenantId) return // platform host — no tenant-user recovery there

      const user = await this.users.findByEmailInTenant(email, tenantId)
      if (!user || !user.isActive) return

      const token = randomBytes(32).toString('base64url')
      const hash = this.hash(token)
      const prev = await this.redis.getdel(this.userKey(user.id))
      const multi = this.redis.multi()
      if (prev) multi.del(this.tokenKey(prev))
      multi.set(this.tokenKey(hash), `${tenantId}:${user.id}`, 'PX', this.ttlMs)
      multi.set(this.userKey(user.id), hash, 'PX', this.ttlMs)
      await multi.exec()

      const [shop, tenant] = await Promise.all([
        this.prisma.scoped.shopConfig.findFirst({ select: { shopName: true } }),
        this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { slug: true, name: true },
        }),
      ])

      const local = user.email.split('@')[0] ?? ''
      await this.email.sendTransactional('password_recovery', user.email, {
        FIRST_NAME: local.charAt(0).toUpperCase() + local.slice(1),
        SHOP_NAME: shop?.shopName ?? tenant?.name ?? '',
        RESET_LINK: tenantUrl(tenant?.slug ?? '', `/admin/redefinir-senha?token=${token}`),
      })
    } catch (e) {
      this.logger.error(`password recovery request failed: ${(e as Error).message}`)
    }
  }

  async reset(token: string, password: string): Promise<void> {
    const invalid = () =>
      new BadRequestException('Link inválido ou expirado. Solicite uma nova redefinição.')

    // GETDEL: token dies on first presentation, valid or not afterwards.
    const payload = await this.redis.getdel(this.tokenKey(this.hash(token)))
    if (!payload) throw invalid()

    const sep = payload.indexOf(':')
    const tokenTenant = payload.slice(0, sep)
    const userId = payload.slice(sep + 1)
    await this.redis.del(this.userKey(userId))

    // Token only works on the host it was issued for.
    const tenantId = TenantContext.tenantId()
    if (!tenantId || tokenTenant !== tenantId) throw invalid()

    const user = await this.users.findByIdInTenant(userId, tenantId)
    if (!user || !user.isActive) throw invalid()

    await this.users.updatePassword(userId, tenantId, await UsersService.hash(password))
    await this.lockout.clear(tenantId, user.email)
  }
}
