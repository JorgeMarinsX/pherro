import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { TenantResolverService } from '../tenant/tenant-resolver.service'
import { AsaasService } from './asaas.service'
import { centsToBrl, isPaidPlan, PLANS } from './plans'

// Data carried in by the caller (avoids re-reading RLS-protected tables here).
export interface EnsureCustomerInput {
  tenantId: string
  name: string
  cpfCnpj?: string | null
  email?: string
}

export interface AsaasWebhookPayload {
  id: string
  event: string
  payment?: { customer?: string; subscription?: string; status?: string }
  [key: string]: unknown
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasService,
    private readonly resolver: TenantResolverService,
  ) {}

  // Best-effort: creates the Asaas customer for a tenant and stores its id.
  // Never throws — billing must not break provisioning.
  async ensureCustomerForTenant(input: EnsureCustomerInput): Promise<void> {
    if (!input.cpfCnpj) return
    if (!this.asaas.isConfigured) {
      this.logger.warn(`Asaas unconfigured — skipping customer creation for tenant ${input.tenantId}`)
      return
    }
    try {
      const existing = await this.prisma.tenant.findUnique({
        where: { id: input.tenantId },
        select: { asaasCustomerId: true },
      })
      if (!existing || existing.asaasCustomerId) return

      const customer = await this.asaas.createCustomer({
        name: input.name,
        cpfCnpj: input.cpfCnpj,
        email: input.email,
        externalReference: input.tenantId,
        notificationDisabled: true,
      })
      await this.prisma.tenant.update({
        where: { id: input.tenantId },
        data: { asaasCustomerId: customer.id },
      })
      this.logger.log(`Asaas customer ${customer.id} linked to tenant ${input.tenantId}`)
    } catch (e) {
      this.logger.error(`Asaas customer creation failed for tenant ${input.tenantId}`, e as Error)
    }
  }

  // Current billing state for a tenant — drives the admin plan page.
  async getStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        status: true,
        cpfCnpj: true,
        asaasCustomerId: true,
        asaasSubscriptionId: true,
      },
    })
    if (!tenant) throw new NotFoundException('Loja não encontrada')

    let subscription: { status: string; invoiceUrl: string | null } | null = null
    if (tenant.asaasSubscriptionId && this.asaas.isConfigured) {
      try {
        const sub = await this.asaas.getSubscription(tenant.asaasSubscriptionId)
        const payments = await this.asaas.listSubscriptionPayments(tenant.asaasSubscriptionId)
        subscription = {
          status: sub.status,
          invoiceUrl: payments.data[0]?.invoiceUrl ?? null,
        }
      } catch (e) {
        this.logger.error(`Failed reading Asaas subscription for tenant ${tenantId}`, e as Error)
      }
    }

    return {
      plan: tenant.plan,
      status: tenant.status,
      hasDocument: !!tenant.cpfCnpj,
      billingConfigured: this.asaas.isConfigured,
      subscription,
    }
  }

  // Create (or replace) the Asaas subscription for a paid plan and flip Tenant.plan.
  // billingType UNDEFINED → Asaas hosts the invoice; customer chooses PIX/boleto/card.
  // Returns the invoice URL to send the customer to.
  async subscribeTenant(tenantId: string, planId: string): Promise<{ plan: string; invoiceUrl: string | null }> {
    const plan = PLANS[planId]
    if (!plan || !isPaidPlan(planId)) {
      throw new BadRequestException('Plano inválido')
    }
    if (!this.asaas.isConfigured) {
      throw new BadRequestException('Pagamentos indisponíveis no momento. Tente novamente mais tarde.')
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, cpfCnpj: true, asaasCustomerId: true, asaasSubscriptionId: true },
    })
    if (!tenant) throw new NotFoundException('Loja não encontrada')
    if (!tenant.cpfCnpj) {
      throw new BadRequestException('Informe seu CPF ou CNPJ antes de assinar um plano.')
    }

    // Lazily create the Asaas customer if signup skipped it (no document then).
    let customerId = tenant.asaasCustomerId
    if (!customerId) {
      const customer = await this.asaas.createCustomer({
        name: tenant.name,
        cpfCnpj: tenant.cpfCnpj,
        externalReference: tenantId,
        notificationDisabled: true,
      })
      customerId = customer.id
      await this.prisma.tenant.update({ where: { id: tenantId }, data: { asaasCustomerId: customerId } })
    }

    // Replacing an existing subscription: cancel the old one first (best-effort).
    if (tenant.asaasSubscriptionId) {
      try {
        await this.asaas.cancelSubscription(tenant.asaasSubscriptionId)
      } catch (e) {
        this.logger.warn(`Failed cancelling old subscription for tenant ${tenantId}: ${(e as Error).message}`)
      }
    }

    const nextDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const sub = await this.asaas.createSubscription({
      customer: customerId,
      billingType: 'UNDEFINED',
      value: centsToBrl(plan.monthlyCents),
      nextDueDate,
      cycle: 'MONTHLY',
      description: `Pherro — plano ${plan.label}`,
      externalReference: tenantId,
    })

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: planId, asaasSubscriptionId: sub.id },
    })

    // First invoice URL (customer pays here). Best-effort: page can retry.
    let invoiceUrl: string | null = null
    try {
      const payments = await this.asaas.listSubscriptionPayments(sub.id)
      invoiceUrl = payments.data[0]?.invoiceUrl ?? null
    } catch (e) {
      this.logger.warn(`Subscription ${sub.id} created but invoice fetch failed: ${(e as Error).message}`)
    }

    this.logger.log(`Tenant ${tenantId} subscribed to ${planId} (Asaas sub ${sub.id})`)
    return { plan: planId, invoiceUrl }
  }

  // Cancel the paid subscription and drop the tenant back to free.
  async cancelSubscription(tenantId: string): Promise<{ plan: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { asaasSubscriptionId: true, plan: true },
    })
    if (!tenant) throw new NotFoundException('Loja não encontrada')
    if (!tenant.asaasSubscriptionId) {
      throw new ConflictException('Nenhuma assinatura ativa para cancelar')
    }

    if (this.asaas.isConfigured) {
      try {
        await this.asaas.cancelSubscription(tenant.asaasSubscriptionId)
      } catch (e) {
        this.logger.error(`Failed cancelling Asaas subscription for tenant ${tenantId}`, e as Error)
        throw new BadRequestException('Não foi possível cancelar a assinatura. Tente novamente.')
      }
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: 'free', asaasSubscriptionId: null },
    })
    this.logger.log(`Tenant ${tenantId} subscription cancelled → free`)
    return { plan: 'free' }
  }

  // Persist-first webhook handling: dedupe by event id (delivery is at-least-once),
  // then dispatch. Processing errors are swallowed — the controller must answer 2xx.
  async handleWebhookEvent(payload: AsaasWebhookPayload): Promise<void> {
    try {
      await this.prisma.asaasWebhookEvent.create({
        data: {
          id: payload.id,
          event: payload.event,
          payload: payload as unknown as Prisma.InputJsonValue,
        },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        this.logger.log(`Duplicate Asaas event ${payload.id} — ignored`)
        return
      }
      throw e
    }

    try {
      await this.dispatch(payload)
    } catch (e) {
      this.logger.error(`Failed processing Asaas event ${payload.id} (${payload.event})`, e as Error)
    }
  }

  private async dispatch(payload: AsaasWebhookPayload): Promise<void> {
    const customerId = payload.payment?.customer
    if (!customerId) return

    const tenant = await this.prisma.tenant.findUnique({
      where: { asaasCustomerId: customerId },
      select: { id: true, slug: true, plan: true, status: true, customDomain: true },
    })
    if (!tenant) {
      this.logger.warn(`Asaas event ${payload.id}: no tenant for customer ${customerId}`)
      return
    }

    switch (payload.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        // First paid invoice takes a self-signup store live.
        if (tenant.status === 'PENDING_PAYMENT') {
          await this.prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'ACTIVE' } })
          await this.resolver.invalidateTenant(tenant)
          this.logger.log(`Tenant ${tenant.slug}: activated on payment (${payload.event})`)
        } else {
          this.logger.log(`Tenant ${tenant.slug}: payment ok (${payload.event})`)
        }
        break
      case 'PAYMENT_OVERDUE':
        this.logger.warn(`Tenant ${tenant.slug}: payment overdue`)
        break
      case 'PAYMENT_REFUNDED':
        this.logger.warn(`Tenant ${tenant.slug}: payment refunded — review manually`)
        break
      default:
        this.logger.log(`Asaas event ${payload.event} for tenant ${tenant.slug} — no handler yet`)
    }
  }
}
