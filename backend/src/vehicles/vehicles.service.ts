import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, VehicleStatus } from '@prisma/client'
import type { Cache } from 'cache-manager'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import {
  ListVehiclesDto,
  VehicleSort,
  VehicleStatusFilter,
} from './dto/list-vehicles.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { VehicleDetailDto, VehicleListItemDto } from './dto/vehicle.dto'
import { buildVehicleSlug } from './slug.util'
import { TenantContext } from '../tenant/tenant-context'

const tPrefix = () => `t:${TenantContext.tenantId() ?? 'none'}:`
const cacheKey = (id: string) => `${tPrefix()}vehicle:${id}`
const slugCacheKey = (slug: string) => `${tPrefix()}vehicle:slug:${slug}`
const VEHICLE_TTL_MS = 60_000
const SLUG_MAX_RETRIES = 5

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async list(q: ListVehiclesDto) {
    const where: Prisma.VehicleWhereInput = {}

    const statusFilter = q.status ?? VehicleStatusFilter.ACTIVE
    if (statusFilter !== VehicleStatusFilter.ALL) {
      where.status = statusFilter as VehicleStatus
    }

    if (q.q?.trim()) {
      const term = q.q.trim()
      where.OR = [
        { make: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
      ]
    }

    if (q.make) where.make = { equals: q.make, mode: 'insensitive' }
    if (q.model) where.model = { contains: q.model, mode: 'insensitive' }
    if (q.color) where.color = { equals: q.color, mode: 'insensitive' }
    if (q.transmission) where.transmission = q.transmission
    if (q.fuelType) where.fuelType = q.fuelType

    if (q.yearMin != null || q.yearMax != null) {
      where.year = { gte: q.yearMin, lte: q.yearMax }
    }
    if (q.priceMin != null || q.priceMax != null) {
      where.price = { gte: q.priceMin, lte: q.priceMax }
    }
    if (q.mileageMax != null) where.mileage = { lte: q.mileageMax }

    const orderBy: Prisma.VehicleOrderByWithRelationInput = (() => {
      switch (q.sort) {
        case VehicleSort.PRICE_ASC: return { price: 'asc' }
        case VehicleSort.PRICE_DESC: return { price: 'desc' }
        case VehicleSort.YEAR_DESC: return { year: 'desc' }
        case VehicleSort.MILEAGE_ASC: return { mileage: 'asc' }
        default: return { createdAt: 'desc' }
      }
    })()

    const take = q.take ?? 24
    const skip = q.skip ?? 0

    const [items, total] = await Promise.all([
      this.prisma.scoped.vehicle.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          id: true, slug: true, make: true, model: true, year: true, price: true,
          mileage: true, color: true, transmission: true, fuelType: true, status: true,
          photos: {
            orderBy: { position: 'asc' },
            take: 1,
            select: { id: true, url: true, position: true },
          },
        },
      }),
      this.prisma.scoped.vehicle.count({ where }),
    ])

    const dtoItems = plainToInstance(VehicleListItemDto, items, { excludeExtraneousValues: true })

    // Warm per-id cache so list → detail click is a hit.
    // Note: list items omit description/whatsappNumber/attributes; cache the slim list shape
    // and let findOne overwrite with the full detail shape on first detail fetch.
    await Promise.all(
      dtoItems.map((item) => this.cache.set(cacheKey(item.id), item, VEHICLE_TTL_MS)),
    )

    return { items: dtoItems, total, take, skip }
  }

  async findOne(id: string): Promise<VehicleDetailDto> {
    const key = cacheKey(id)
    const cached = await this.cache.get<VehicleDetailDto>(key)
    // Only return cache hit if it's the full detail shape (has `attributes` array set).
    if (cached && Array.isArray((cached as VehicleDetailDto).attributes)) {
      return cached
    }

    const v = await this.prisma.scoped.vehicle.findFirst({
      where: { id },
      include: {
        photos: { orderBy: { position: 'asc' } },
        whatsappNumber: { select: { id: true, label: true, number: true } },
        attributes: {
          select: {
            value: true,
            attributeDefinition: {
              select: { id: true, name: true, slug: true, icon: true, type: true },
            },
          },
        },
      },
    })
    if (!v) throw new NotFoundException(`Vehicle ${id} not found.`)

    const dto = plainToInstance(VehicleDetailDto, v, { excludeExtraneousValues: true })
    await this.cache.set(key, dto, VEHICLE_TTL_MS)
    await this.cache.set(slugCacheKey(dto.slug), dto, VEHICLE_TTL_MS)
    return dto
  }

  // by-slug is the public storefront read path (admin uses findOne by id).
  // Only ACTIVE vehicles are publicly visible — a deactivated listing must 404
  // even via a direct/cached slug link, not just disappear from the list.
  async findBySlug(slug: string): Promise<VehicleDetailDto> {
    const key = slugCacheKey(slug)
    const cached = await this.cache.get<VehicleDetailDto>(key)
    if (cached && Array.isArray((cached as VehicleDetailDto).attributes)) {
      if (cached.status !== VehicleStatus.ACTIVE) {
        throw new NotFoundException(`Vehicle slug "${slug}" not found.`)
      }
      return cached
    }

    const v = await this.prisma.scoped.vehicle.findFirst({
      where: { slug },
      include: {
        photos: { orderBy: { position: 'asc' } },
        whatsappNumber: { select: { id: true, label: true, number: true } },
        attributes: {
          select: {
            value: true,
            attributeDefinition: {
              select: { id: true, name: true, slug: true, icon: true, type: true },
            },
          },
        },
      },
    })
    if (!v) throw new NotFoundException(`Vehicle slug "${slug}" not found.`)

    const dto = plainToInstance(VehicleDetailDto, v, { excludeExtraneousValues: true })
    // Still warm the cache (keeps id/slug keys hot for admin reads), but hide
    // non-ACTIVE from the public response.
    await this.cache.set(key, dto, VEHICLE_TTL_MS)
    await this.cache.set(cacheKey(dto.id), dto, VEHICLE_TTL_MS)
    if (dto.status !== VehicleStatus.ACTIVE) {
      throw new NotFoundException(`Vehicle slug "${slug}" not found.`)
    }
    return dto
  }

  async create(dto: CreateVehicleDto): Promise<VehicleDetailDto> {
    // Slug is immutable post-create. Retry on unique-constraint collision (P2002).
    let lastErr: unknown
    for (let attempt = 0; attempt < SLUG_MAX_RETRIES; attempt++) {
      const slug = buildVehicleSlug(dto.make, dto.model, dto.year)
      try {
        const created = await this.prisma.scoped.vehicle.create({
          data: {
            slug,
            make: dto.make,
            model: dto.model,
            year: dto.year,
            price: dto.price,
            mileage: dto.mileage,
            color: dto.color,
            description: dto.description ?? null,
            transmission: dto.transmission,
            fuelType: dto.fuelType,
            // undefined → Prisma schema default (ACTIVE).
            status: (dto.status as VehicleStatus | undefined) ?? undefined,
            whatsappNumberId: dto.whatsappNumberId ?? null,
            photos: dto.photos?.length
              ? { create: dto.photos.map((p) => ({ url: p.url, position: p.position })) }
              : undefined,
            attributes: dto.attributes?.length
              ? {
                  create: dto.attributes.map((a) => ({
                    attributeDefinitionId: a.attributeDefinitionId,
                    value: a.value,
                  })),
                }
              : undefined,
          },
          include: {
            photos: { orderBy: { position: 'asc' } },
            whatsappNumber: { select: { id: true, label: true, number: true } },
            attributes: {
          select: {
            value: true,
            attributeDefinition: {
              select: { id: true, name: true, slug: true, icon: true, type: true },
            },
          },
        },
          },
        })
        const result = plainToInstance(VehicleDetailDto, created, { excludeExtraneousValues: true })
        await this.cache.set(cacheKey(result.id), result, VEHICLE_TTL_MS)
        await this.cache.set(slugCacheKey(result.slug), result, VEHICLE_TTL_MS)
        return result
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002' &&
          Array.isArray(e.meta?.target) &&
          (e.meta?.target as string[]).includes('slug')
        ) {
          lastErr = e
          continue
        }
        throw e
      }
    }
    throw lastErr ?? new Error('Failed to generate unique vehicle slug.')
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<VehicleDetailDto> {
    const exists = await this.prisma.scoped.vehicle.findFirst({
      where: { id },
      select: { id: true, slug: true },
    })
    if (!exists) throw new NotFoundException(`Vehicle ${id} not found.`)

    const { photos, attributes, ...scalar } = dto

    await this.prisma.runInTenantTx(async (tx) => {
      await tx.vehicle.update({ where: { id }, data: scalar })

      if (photos) {
        await tx.vehiclePhoto.deleteMany({ where: { vehicleId: id } })
        if (photos.length) {
          await tx.vehiclePhoto.createMany({
            data: photos.map((p) => ({ vehicleId: id, url: p.url, position: p.position })),
          })
        }
      }

      if (attributes) {
        await tx.vehicleAttribute.deleteMany({ where: { vehicleId: id } })
        if (attributes.length) {
          await tx.vehicleAttribute.createMany({
            data: attributes.map((a) => ({
              vehicleId: id,
              attributeDefinitionId: a.attributeDefinitionId,
              value: a.value,
            })),
          })
        }
      }
    })

    await this.cache.del(cacheKey(id))
    await this.cache.del(slugCacheKey(exists.slug))
    return this.findOne(id)
  }

  async remove(id: string) {
    const exists = await this.prisma.scoped.vehicle.findFirst({
      where: { id },
      select: { id: true, slug: true },
    })
    if (!exists) throw new NotFoundException(`Vehicle ${id} not found.`)
    await this.prisma.scoped.vehicle.delete({ where: { id } })
    await this.cache.del(cacheKey(id))
    await this.cache.del(slugCacheKey(exists.slug))
    return { ok: true }
  }
}
