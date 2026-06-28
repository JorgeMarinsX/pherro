import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { TenantContext } from '../tenant/tenant-context'
import { ShopConfigDto } from './dto/shop-config.dto'
import { UpdateShopConfigDto } from './dto/update-shop-config.dto'

const cacheKey = () => `t:${TenantContext.tenantId() ?? 'none'}:shop-config:current`
const CACHE_TTL_MS = 60_000

@Injectable()
export class ShopConfigService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async get(): Promise<ShopConfigDto> {
    const key = cacheKey()
    const cached = await this.cache.get<ShopConfigDto>(key)
    if (cached) return cached

    const config = await this.prisma.scoped.shopConfig.findFirst({
      include: { whatsappNumbers: { orderBy: { createdAt: 'asc' } } },
    })
    if (!config) throw new NotFoundException('ShopConfig not seeded.')

    const dto = plainToInstance(ShopConfigDto, config, { excludeExtraneousValues: true })
    await this.cache.set(key, dto, CACHE_TTL_MS)
    return dto
  }

  async update(dto: UpdateShopConfigDto): Promise<ShopConfigDto> {
    const existing = await this.prisma.scoped.shopConfig.findFirst({ select: { id: true } })
    if (!existing) throw new NotFoundException('ShopConfig not seeded.')

    const updated = await this.prisma.scoped.shopConfig.update({
      where: { id: existing.id },
      data: dto,
      include: { whatsappNumbers: { orderBy: { createdAt: 'asc' } } },
    })

    await this.cache.del(cacheKey())
    return plainToInstance(ShopConfigDto, updated, { excludeExtraneousValues: true })
  }
}
