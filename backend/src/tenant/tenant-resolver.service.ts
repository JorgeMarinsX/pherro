import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { TenantStatus } from '@prisma/client'
import type { Cache } from 'cache-manager'
import { PrismaService } from '../prisma/prisma.service'

const hostKey = (host: string) => `host:${host}`
const HOST_TTL_MS = 300_000

export type ResolvedTenant = { id: string; status: TenantStatus }

@Injectable()
export class TenantResolverService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async resolveByHost(host: string): Promise<ResolvedTenant | null> {
    const normalized = host.toLowerCase().split(':')[0]
    const key = hostKey(normalized)
    const cached = await this.cache.get<ResolvedTenant | null>(key)
    if (cached !== undefined) return cached

    const slug = this.slugFromHost(normalized)
    const tenant = await this.prisma.tenant.findFirst({
      where: slug
        ? { OR: [{ slug }, { customDomain: normalized }] }
        : { customDomain: normalized },
      select: { id: true, status: true },
    })

    await this.cache.set(key, tenant, HOST_TTL_MS)
    return tenant
  }

  private slugFromHost(host: string): string | null {
    const base = process.env.APP_BASE_DOMAIN ?? 'pherro.app'
    const suffix = `.${base}`
    if (!host.endsWith(suffix)) return null
    const sub = host.slice(0, -suffix.length)
    if (!sub || sub === 'app' || sub === 'www') return null
    return sub
  }

  async invalidate(host: string): Promise<void> {
    await this.cache.del(hostKey(host.toLowerCase().split(':')[0]))
  }
}
