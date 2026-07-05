import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EmailCampaign } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { PlanLimitsService } from '../billing/plan-limits.service'
import { CAMPAIGN_VARIABLES, DEFAULT_CAMPAIGN_HTML } from '../email/default-templates'
import { ResendService, RESEND_BATCH_LIMIT } from '../email/resend.service'
import { renderHtml, renderText, type TemplateVars } from '../email/template-renderer'
import { PrismaService } from '../prisma/prisma.service'
import { TenantContext } from '../tenant/tenant-context'
import { CampaignDto } from './dto/campaign.dto'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'

interface Recipient {
  leadId: string | null
  name: string
  email: string
  phone: string
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly resend: ResendService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async list() {
    const items = await this.prisma.scoped.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return { items: items.map((c) => this.toDto(c)), emailConfigured: this.resend.isConfigured }
  }

  async create(dto: CreateCampaignDto): Promise<CampaignDto> {
    const campaign = await this.prisma.scoped.emailCampaign.create({
      data: { name: dto.name, html: DEFAULT_CAMPAIGN_HTML },
    })
    return this.toDto(campaign)
  }

  async findOne(id: string): Promise<CampaignDto> {
    return this.toDto(await this.requireCampaign(id))
  }

  async update(id: string, dto: UpdateCampaignDto): Promise<CampaignDto> {
    const campaign = await this.requireCampaign(id)
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Campanha já enviada não pode ser editada')
    }
    const updated = await this.prisma.scoped.emailCampaign.update({ where: { id }, data: dto })
    return this.toDto(updated)
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.requireCampaign(id)
    if (campaign.status === 'SENDING') {
      throw new BadRequestException('Campanha em envio não pode ser excluída')
    }
    await this.prisma.scoped.emailCampaign.delete({ where: { id } })
  }

  // Audience = leads with e-mail, deduped by address (most recent lead wins).
  async recipientsPreview() {
    const recipients = await this.recipients()
    return {
      total: recipients.length,
      sample: recipients.slice(0, 5).map(({ name, email }) => ({ name, email })),
      emailConfigured: this.resend.isConfigured,
    }
  }

  async sendTest(id: string, to: string): Promise<{ id: string }> {
    this.requireConfigured()
    const campaign = await this.requireCampaign(id)
    this.requireContent(campaign)
    await this.planLimits.assertCanSendEmails(1)
    const vars: TemplateVars = {
      ...Object.fromEntries(CAMPAIGN_VARIABLES.map((v) => [v.key, v.sample])),
      SHOP_NAME: await this.shopName(),
    }
    const result = await this.resend.sendEmail({
      to,
      subject: `[TESTE] ${renderText(campaign.subject, vars)}`,
      html: renderHtml(campaign.html, vars),
    })
    await this.planLimits.recordEmailsSent(1)
    return result
  }

  async send(id: string): Promise<CampaignDto> {
    this.requireConfigured()
    const campaign = await this.requireCampaign(id)
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Campanha já foi enviada')
    }
    this.requireContent(campaign)

    const recipients = await this.recipients()
    if (recipients.length === 0) {
      throw new BadRequestException('Nenhum lead com e-mail cadastrado')
    }
    await this.planLimits.assertCanSendEmails(recipients.length)

    const tenantId = TenantContext.tenantId()!
    const shopName = await this.shopName()

    await this.prisma.scoped.emailCampaign.update({
      where: { id },
      data: { status: 'SENDING', recipientCount: recipients.length },
    })
    // createMany doesn't go through the extension's top-level inject — set tenantId explicitly.
    await this.prisma.scoped.campaignRecipient.createMany({
      data: recipients.map((r) => ({
        tenantId,
        campaignId: id,
        leadId: r.leadId,
        email: r.email,
        name: r.name,
      })),
    })

    let sent = 0
    let failed = 0
    for (const chunk of this.chunks(recipients, RESEND_BATCH_LIMIT)) {
      try {
        const res = await this.resend.sendBatch(
          chunk.map((r) => ({
            to: r.email,
            subject: renderText(campaign.subject, this.leadVars(r, shopName)),
            html: renderHtml(campaign.html, this.leadVars(r, shopName)),
          })),
        )
        await Promise.all(
          chunk.map((r, i) =>
            this.prisma.scoped.campaignRecipient.updateMany({
              where: { campaignId: id, email: r.email },
              data: { status: 'SENT', resendId: res.data[i]?.id ?? null },
            }),
          ),
        )
        sent += chunk.length
      } catch (e) {
        const message = (e as Error).message.slice(0, 500)
        this.logger.error(`campaign ${id} batch failed: ${message}`)
        await this.prisma.scoped.campaignRecipient.updateMany({
          where: { campaignId: id, email: { in: chunk.map((r) => r.email) } },
          data: { status: 'FAILED', error: message },
        })
        failed += chunk.length
      }
    }

    await this.planLimits.recordEmailsSent(sent)

    const updated = await this.prisma.scoped.emailCampaign.update({
      where: { id },
      data: {
        status: sent > 0 ? 'SENT' : 'FAILED',
        sentCount: sent,
        failedCount: failed,
        sentAt: new Date(),
      },
    })
    return this.toDto(updated)
  }

  private async recipients(): Promise<Recipient[]> {
    const leads = await this.prisma.scoped.lead.findMany({
      where: { email: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true },
    })
    const byEmail = new Map<string, Recipient>()
    for (const l of leads) {
      const email = l.email!.toLowerCase()
      if (!byEmail.has(email)) {
        byEmail.set(email, { leadId: l.id, name: l.name, email, phone: l.phone })
      }
    }
    return [...byEmail.values()]
  }

  private leadVars(r: Recipient, shopName: string): TemplateVars {
    return {
      FIRST_NAME: r.name.trim().split(/\s+/)[0] ?? '',
      NAME: r.name,
      EMAIL: r.email,
      PHONE: r.phone,
      SHOP_NAME: shopName,
    }
  }

  private async shopName(): Promise<string> {
    const config = await this.prisma.scoped.shopConfig.findFirst({ select: { shopName: true } })
    return config?.shopName ?? ''
  }

  private requireConfigured(): void {
    if (!this.resend.isConfigured) {
      throw new BadRequestException('Integração de e-mail não configurada (RESEND_API_KEY)')
    }
  }

  private requireContent(campaign: EmailCampaign): void {
    if (!campaign.subject.trim() || !campaign.html.trim()) {
      throw new BadRequestException('Preencha assunto e conteúdo antes de enviar')
    }
  }

  private async requireCampaign(id: string): Promise<EmailCampaign> {
    const campaign = await this.prisma.scoped.emailCampaign.findFirst({ where: { id } })
    if (!campaign) throw new NotFoundException('Campanha não encontrada')
    return campaign
  }

  private *chunks<T>(arr: T[], size: number): Generator<T[]> {
    for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size)
  }

  private toDto(campaign: EmailCampaign): CampaignDto {
    return plainToInstance(
      CampaignDto,
      { ...campaign, variables: CAMPAIGN_VARIABLES },
      { excludeExtraneousValues: true },
    )
  }
}
