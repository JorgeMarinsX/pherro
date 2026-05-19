import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { ShopConfigDto } from './dto/shop-config.dto'
import { UpdateShopConfigDto } from './dto/update-shop-config.dto'

const CACHE_KEY = 'shop-config:current'
const CACHE_TTL_MS = 60_000

@Injectable()
export class ShopConfigService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async get(): Promise<ShopConfigDto> {
    const cached = await this.cache.get<ShopConfigDto>(CACHE_KEY)
    if (cached) return cached

    const config = await this.prisma.shopConfig.findFirst({
      include: { whatsappNumbers: { orderBy: { createdAt: 'asc' } } },
    })
    if (!config) throw new NotFoundException('ShopConfig not seeded.')

    const dto = plainToInstance(ShopConfigDto, config, { excludeExtraneousValues: true })
    await this.cache.set(CACHE_KEY, dto, CACHE_TTL_MS)
    return dto
  }

  async update(dto: UpdateShopConfigDto): Promise<ShopConfigDto> {
    const existing = await this.prisma.shopConfig.findFirst({ select: { id: true } })
    if (!existing) throw new NotFoundException('ShopConfig not seeded.')

    const updated = await this.prisma.shopConfig.update({
      where: { id: existing.id },
      data: dto,
      include: { whatsappNumbers: { orderBy: { createdAt: 'asc' } } },
    })

    await this.cache.del(CACHE_KEY)
    return plainToInstance(ShopConfigDto, updated, { excludeExtraneousValues: true })
  }
}
