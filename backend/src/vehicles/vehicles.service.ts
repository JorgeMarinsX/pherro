import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, VehicleStatus } from '@prisma/client'
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

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListVehiclesDto) {
    const where: Prisma.VehicleWhereInput = {}

    const statusFilter = q.status ?? VehicleStatusFilter.ACTIVE
    if (statusFilter !== VehicleStatusFilter.ALL) {
      where.status = statusFilter as VehicleStatus
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

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          id: true, make: true, model: true, year: true, price: true,
          mileage: true, color: true, transmission: true, fuelType: true, status: true,
          photos: {
            orderBy: { position: 'asc' },
            take: 1,
            select: { id: true, url: true, position: true },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ])

    return {
      items: plainToInstance(VehicleListItemDto, items, { excludeExtraneousValues: true }),
      total,
      take,
      skip,
    }
  }

  async findOne(id: string): Promise<VehicleDetailDto> {
    const v = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { position: 'asc' } },
        whatsappNumber: { select: { id: true, label: true, number: true } },
        attributes: { select: { attributeDefinitionId: true, value: true } },
      },
    })
    if (!v) throw new NotFoundException(`Vehicle ${id} not found.`)
    return plainToInstance(VehicleDetailDto, v, { excludeExtraneousValues: true })
  }

  async create(dto: CreateVehicleDto): Promise<VehicleDetailDto> {
    const created = await this.prisma.vehicle.create({
      data: {
        make: dto.make,
        model: dto.model,
        year: dto.year,
        price: dto.price,
        mileage: dto.mileage,
        color: dto.color,
        description: dto.description ?? null,
        transmission: dto.transmission,
        fuelType: dto.fuelType,
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
        attributes: { select: { attributeDefinitionId: true, value: true } },
      },
    })
    return plainToInstance(VehicleDetailDto, created, { excludeExtraneousValues: true })
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<VehicleDetailDto> {
    const exists = await this.prisma.vehicle.findUnique({ where: { id }, select: { id: true } })
    if (!exists) throw new NotFoundException(`Vehicle ${id} not found.`)

    const { photos, attributes, ...scalar } = dto

    await this.prisma.$transaction(async (tx) => {
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

    return this.findOne(id)
  }

  async remove(id: string) {
    const exists = await this.prisma.vehicle.findUnique({ where: { id }, select: { id: true } })
    if (!exists) throw new NotFoundException(`Vehicle ${id} not found.`)
    await this.prisma.vehicle.delete({ where: { id } })
    return { ok: true }
  }
}
