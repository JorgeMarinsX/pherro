import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AsaasService } from './asaas.service'

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
      select: { id: true, slug: true, plan: true },
    })
    if (!tenant) {
      this.logger.warn(`Asaas event ${payload.id}: no tenant for customer ${customerId}`)
      return
    }

    switch (payload.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        this.logger.log(`Tenant ${tenant.slug}: payment ok (${payload.event})`)
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
