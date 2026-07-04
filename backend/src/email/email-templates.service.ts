import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EmailTemplate } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { DEFAULT_TEMPLATES, type DefaultTemplate, type TemplateKey } from './default-templates'
import { EmailTemplateDto } from './dto/template.dto'
import { UpdateTemplateDto } from './dto/update-template.dto'
import { ResendService } from './resend.service'
import { renderHtml, renderText, type TemplateVars } from './template-renderer'

// EmailTemplate is platform-owned (no tenantId) — plain client, never `.scoped`.
@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly resend: ResendService,
  ) {}

  async list(): Promise<EmailTemplateDto[]> {
    await this.ensureDefaults()
    const rows = await this.prisma.emailTemplate.findMany()
    // Catalog order, not DB order.
    return DEFAULT_TEMPLATES
      .map((def) => {
        const row = rows.find((r) => r.key === def.key)
        return row ? this.toDto(row, def) : null
      })
      .filter((t): t is EmailTemplateDto => t !== null)
  }

  async get(key: string): Promise<EmailTemplateDto> {
    const def = this.definition(key)
    await this.ensureDefaults()
    const row = await this.prisma.emailTemplate.findUnique({ where: { key } })
    if (!row) throw new NotFoundException('Modelo não encontrado')
    return this.toDto(row, def)
  }

  async update(key: string, dto: UpdateTemplateDto): Promise<EmailTemplateDto> {
    const def = this.definition(key)
    await this.ensureDefaults()
    const row = await this.prisma.emailTemplate.update({ where: { key }, data: dto })
    return this.toDto(row, def)
  }

  async sendTest(key: string, to: string): Promise<{ id: string }> {
    if (!this.resend.isConfigured) {
      throw new BadRequestException('Integração de e-mail não configurada (RESEND_API_KEY)')
    }
    const def = this.definition(key)
    const tpl = await this.get(key)
    const samples: TemplateVars = Object.fromEntries(def.variables.map((v) => [v.key, v.sample]))
    return this.resend.sendEmail({
      to,
      subject: `[TESTE] ${renderText(tpl.subject, samples)}`,
      html: renderHtml(tpl.html, samples),
    })
  }

  // Best-effort: transactional e-mail must NEVER break the triggering flow.
  // Skips silently when unconfigured or template inactive; logs failures.
  async sendTransactional(key: TemplateKey, to: string | string[], vars: TemplateVars): Promise<void> {
    try {
      if (!this.resend.isConfigured) return
      const row = await this.prisma.emailTemplate.findUnique({ where: { key } })
      const def = this.definition(key)
      const subject = row?.subject ?? def.subject
      const html = row?.html ?? def.html
      if (row && !row.isActive) return
      await this.resend.sendEmail({
        to,
        subject: renderText(subject, vars),
        html: renderHtml(html, vars),
      })
    } catch (e) {
      this.logger.error(`transactional "${key}" failed: ${(e as Error).message}`)
    }
  }

  private definition(key: string): DefaultTemplate {
    const def = DEFAULT_TEMPLATES.find((t) => t.key === key)
    if (!def) throw new NotFoundException('Modelo não encontrado')
    return def
  }

  // Lazy seed — new template keys appear on next panel load, no migration needed.
  private async ensureDefaults(): Promise<void> {
    await this.prisma.emailTemplate.createMany({
      data: DEFAULT_TEMPLATES.map(({ key, name, subject, html }) => ({ key, name, subject, html })),
      skipDuplicates: true,
    })
  }

  private toDto(row: EmailTemplate, def: DefaultTemplate): EmailTemplateDto {
    return plainToInstance(
      EmailTemplateDto,
      { ...row, name: def.name, description: def.description, variables: def.variables },
      { excludeExtraneousValues: true },
    )
  }
}
