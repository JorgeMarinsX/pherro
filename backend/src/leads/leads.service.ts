import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma, type Lead } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { EmailTemplatesService } from '../email/email-templates.service'
import { tenantUrl } from '../email/tenant-urls'
import { PrismaService } from '../prisma/prisma.service'
import { TenantContext } from '../tenant/tenant-context'
import { CreateLeadDto, LeadSourceDto } from './dto/create-lead.dto'
import { LeadDto } from './dto/lead.dto'
import { ListLeadsDto } from './dto/list-leads.dto'

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailTemplatesService,
  ) {}

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
    // Fire-and-forget: notification must never block or fail the public form.
    if (lead.source === 'FORM') {
      void this.notifyNewLead(lead).catch((e: Error) =>
        this.logger.error(`new-lead notification failed: ${e.message}`),
      )
    }
    return plainToInstance(LeadDto, lead, { excludeExtraneousValues: true })
  }

  // E-mails every active ADMIN of the tenant using the `new_lead` template.
  private async notifyNewLead(lead: Lead): Promise<void> {
    const admins = await this.prisma.scoped.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { email: true },
    })
    if (admins.length === 0) return

    const [shop, interest, tenant] = await Promise.all([
      this.prisma.scoped.shopConfig.findFirst({ select: { shopName: true } }),
      this.prisma.scoped.leadVehicleInterest.findFirst({
        where: { leadId: lead.id },
        include: { vehicle: { select: { make: true, model: true, year: true } } },
      }),
      this.prisma.tenant.findUnique({
        where: { id: lead.tenantId },
        select: { slug: true },
      }),
    ])

    const vehicle = interest
      ? `${interest.vehicle.make} ${interest.vehicle.model} ${interest.vehicle.year}`
      : ''

    await this.email.sendTransactional('new_lead', admins.map((a) => a.email), {
      SHOP_NAME: shop?.shopName ?? '',
      LEAD_NAME: lead.name,
      LEAD_PHONE: lead.phone,
      LEAD_EMAIL: lead.email ?? '—',
      VEHICLE: vehicle,
      ADMIN_URL: tenantUrl(tenant?.slug ?? '', '/admin/leads'),
    })
  }

  async list(q: ListLeadsDto) {
    const where: Prisma.LeadWhereInput = {}
    if (q.phone) where.phone = { contains: q.phone }
    if (q.source) where.source = q.source
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
