import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { TenantContext } from '../tenant/tenant-context'
import { CreateLeadDto, LeadSourceDto } from './dto/create-lead.dto'
import { LeadDto } from './dto/lead.dto'
import { ListLeadsDto } from './dto/list-leads.dto'

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto): Promise<LeadDto> {
    // Nested creates bypass the extension's top-level inject — set tenantId explicitly.
    const tenantId = TenantContext.tenantId()!
    const lead = await this.prisma.scoped.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        notes: dto.notes ?? null,
        source: dto.source ?? LeadSourceDto.FORM,
        vehicleInterests: dto.vehicleInterests?.length
          ? {
              create: dto.vehicleInterests.map((v) => ({
                tenantId,
                vehicleId: v.vehicleId,
                notes: v.notes ?? null,
              })),
            }
          : undefined,
      },
      include: { vehicleInterests: true },
    })
    return plainToInstance(LeadDto, lead, { excludeExtraneousValues: true })
  }

  async list(q: ListLeadsDto) {
    const where: Prisma.LeadWhereInput = {}
    if (q.phone) where.phone = { contains: q.phone }
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const take = q.take ?? 50
    const skip = q.skip ?? 0

    const [items, total] = await Promise.all([
      this.prisma.scoped.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { vehicleInterests: true },
      }),
      this.prisma.scoped.lead.count({ where }),
    ])

    return {
      items: plainToInstance(LeadDto, items, { excludeExtraneousValues: true }),
      total,
      take,
      skip,
    }
  }

  async findOne(id: string): Promise<LeadDto> {
    const lead = await this.prisma.scoped.lead.findFirst({
      where: { id },
      include: { vehicleInterests: true },
    })
    if (!lead) throw new NotFoundException(`Lead ${id} not found.`)
    return plainToInstance(LeadDto, lead, { excludeExtraneousValues: true })
  }
}
