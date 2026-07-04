import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { TenantStatus } from '@prisma/client'
import type { Cache } from 'cache-manager'
import { PrismaService } from '../prisma/prisma.service'

const hostKey = (host: string) => `host:${host}`
const idKey = (id: string) => `tenant:id:${id}`
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
    let tenant = await this.prisma.tenant.findFirst({
      where: slug
        ? { OR: [{ slug }, { customDomain: normalized }] }
        : { customDomain: normalized },
      select: { id: true, status: true },
    })

    // Dev fallback: localhost carries no tenant host — resolve the seeded tenant.
    // Platform hosts (app.*/www.*/bare base) stay tenant-less so platform login works.
    // Demo hosts stay tenant-less too — their tenant comes from the BFF's x-tenant-id.
    if (
      !tenant &&
      !this.isPlatformHost(normalized) &&
      !normalized.startsWith('demo.') &&
      process.env.NODE_ENV !== 'production' &&
      process.env.TENANT_SLUG
    ) {
      tenant = await this.prisma.tenant.findUnique({
        where: { slug: process.env.TENANT_SLUG },
        select: { id: true, status: true },
      })
    }

    await this.cache.set(key, tenant, HOST_TTL_MS)
    return tenant
  }

  // Validates S2S `x-tenant-id` — never trust a raw header id without a row.
  async resolveById(id: string): Promise<ResolvedTenant | null> {
    const key = idKey(id)
    const cached = await this.cache.get<ResolvedTenant | null>(key)
    if (cached !== undefined) return cached

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, status: true },
    })
    await this.cache.set(key, tenant, HOST_TTL_MS)
    return tenant
  }

  private isPlatformHost(host: string): boolean {
    const base = process.env.APP_BASE_DOMAIN ?? 'pherro.app'
    return host === base || host.startsWith('app.') || host.startsWith('www.')
  }

  private slugFromHost(host: string): string | null {
    const base = process.env.APP_BASE_DOMAIN ?? 'pherro.app'
    const suffix = `.${base}`
    if (!host.endsWith(suffix)) return null
    const sub = host.slice(0, -suffix.length)
    if (!sub || sub === 'app' || sub === 'www' || sub === 'demo') return null
    return sub
  }

  async invalidate(host: string): Promise<void> {
    await this.cache.del(hostKey(host.toLowerCase().split(':')[0]))
  }

  // Drop every cache entry that can resolve this tenant (suspend/update must bite now).
  async invalidateTenant(t: { id: string; slug: string; customDomain: string | null }): Promise<void> {
    const base = process.env.APP_BASE_DOMAIN ?? 'pherro.app'
    const keys = [idKey(t.id), hostKey(`${t.slug}.${base}`)]
    if (t.customDomain) keys.push(hostKey(t.customDomain.toLowerCase()))
    await Promise.all(keys.map((k) => this.cache.del(k)))
  }
}
