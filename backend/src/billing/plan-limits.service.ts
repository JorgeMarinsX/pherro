import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ObjectStorage } from '../storage/object-storage'
import { TenantContext } from '../tenant/tenant-context'
import { PLANS, type Plan, type PlanLimits } from './plans'

const MB = 1024 * 1024

export interface PlanUsageSummary {
  plan: string
  label: string
  limits: PlanLimits
  usage: { vehicles: number; leads: number; emailsPerMonth: number; storageMb: number }
}

export interface PhotoStorageBudget {
  quotaBytes: number | null // null = unlimited
  usedBytes: number
}

// Enforces plan quotas (vehicles, leads, e-mails/month) for the current tenant.
// Unknown plan ids (e.g. "demo") fall back to free limits.
@Injectable()
export class PlanLimitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorage,
  ) {}

  async assertCanCreateVehicle(): Promise<void> {
    const { vehicles } = await this.limits()
    if (vehicles === null) return
    const count = await this.prisma.scoped.vehicle.count()
    if (count >= vehicles) {
      throw new ForbiddenException(
        `Limite de ${vehicles} veículos do seu plano atingido. Faça upgrade para cadastrar mais.`,
      )
    }
  }

  async assertCanCreateLead(): Promise<void> {
    const { leads } = await this.limits()
    if (leads === null) return
    const count = await this.prisma.scoped.lead.count()
    if (count >= leads) {
      throw new ForbiddenException(
        `Limite de ${leads} leads do plano atingido. Faça upgrade para cadastrar mais.`,
      )
    }
  }

  // Campaign/test sends only — transactional e-mails are best-effort and never blocked.
  async assertCanSendEmails(count: number): Promise<void> {
    const { emailsPerMonth } = await this.limits()
    if (emailsPerMonth === null) return
    const used = await this.emailsSentThisMonth()
    if (used + count > emailsPerMonth) {
      throw new ForbiddenException(
        `Limite de ${emailsPerMonth} e-mails/mês do seu plano atingido (${used} já enviados). Faça upgrade para enviar mais.`,
      )
    }
  }

  async recordEmailsSent(count: number): Promise<void> {
    if (count <= 0) return
    const tenantId = TenantContext.tenantId()!
    const period = this.period()
    await this.prisma.scoped.emailUsage.upsert({
      where: { tenantId_period: { tenantId, period } },
      create: { tenantId, period, sent: count },
      update: { sent: { increment: count } },
    })
  }

  // Snapshot for the uploads path: quota from plan, usage from stored files.
  async photoStorageBudget(): Promise<PhotoStorageBudget> {
    const { storageMb } = await this.limits()
    const usedBytes = await this.photoStorageUsedBytes()
    return { quotaBytes: storageMb === null ? null : storageMb * MB, usedBytes }
  }

  async usageSummary(): Promise<PlanUsageSummary> {
    const plan = await this.plan()
    const [vehicles, leads, emails, storageBytes] = await Promise.all([
      this.prisma.scoped.vehicle.count(),
      this.prisma.scoped.lead.count(),
      this.emailsSentThisMonth(),
      this.photoStorageUsedBytes(),
    ])
    return {
      plan: plan.id,
      label: plan.label,
      limits: plan.limits,
      usage: { vehicles, leads, emailsPerMonth: emails, storageMb: Math.round(storageBytes / MB) },
    }
  }

  private photoStorageUsedBytes(): Promise<number> {
    return this.storage.usedBytes(`vehicle-photos/${TenantContext.tenantId()!}`)
  }

  private async plan(): Promise<Plan> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: TenantContext.tenantId()! },
      select: { plan: true },
    })
    return PLANS[tenant?.plan ?? 'free'] ?? PLANS.free!
  }

  private async limits(): Promise<PlanLimits> {
    return (await this.plan()).limits
  }

  private async emailsSentThisMonth(): Promise<number> {
    const usage = await this.prisma.scoped.emailUsage.findFirst({
      where: { period: this.period() },
    })
    return usage?.sent ?? 0
  }

  private period(): string {
    return new Date().toISOString().slice(0, 7) // "YYYY-MM" (UTC)
  }
}
