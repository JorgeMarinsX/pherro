import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { BillingService } from '../billing/billing.service'
import { EmailTemplatesService } from '../email/email-templates.service'
import { tenantUrl } from '../email/tenant-urls'
import { PrismaService } from '../prisma/prisma.service'
import { TenantResolverService } from '../tenant/tenant-resolver.service'
import { UsersService } from '../users/users.service'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { SignupDto } from './dto/signup.dto'
import { TenantDto } from './dto/tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'

// Subdomains that must never become tenant sites.
const RESERVED_SLUGS = new Set([
  'app', 'www', 'api', 'admin', 'platform', 'demo', 'mail', 'smtp', 'static', 'cdn', 'assets', 'status',
])

export const DEFAULT_ATTRIBUTES = [
  { name: 'Ar-condicionado', slug: 'ar-condicionado', icon: 'i-lucide-snowflake', type: 'BOOLEAN' },
  { name: 'Direção hidráulica', slug: 'direcao-hidraulica', icon: 'i-lucide-circle-dot', type: 'BOOLEAN' },
  { name: 'Vidros elétricos', slug: 'vidros-eletricos', icon: 'i-lucide-square-chevron-up', type: 'BOOLEAN' },
  { name: 'Travas elétricas', slug: 'travas-eletricas', icon: 'i-lucide-lock', type: 'BOOLEAN' },
  { name: 'Airbag', slug: 'airbag', icon: 'i-lucide-shield', type: 'BOOLEAN' },
  { name: 'Câmera de ré', slug: 'camera-de-re', icon: 'i-lucide-camera', type: 'BOOLEAN' },
] as const

@Injectable()
export class PlatformTenantsService {
  private readonly logger = new Logger(PlatformTenantsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: TenantResolverService,
    private readonly billing: BillingService,
    private readonly email: EmailTemplatesService,
  ) {}

  async list(): Promise<TenantDto[]> {
    const tenants = await this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } })
    return plainToInstance(TenantDto, tenants, { excludeExtraneousValues: true })
  }

  async findOne(id: string): Promise<TenantDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } })
    if (!tenant) throw new NotFoundException('Loja não encontrada')
    return plainToInstance(TenantDto, tenant, { excludeExtraneousValues: true })
  }

  // Platform-admin provisioning: tenant row + seeded defaults, active immediately.
  async create(dto: CreateTenantDto): Promise<TenantDto> {
    const tenant = await this.provision({
      slug: dto.slug,
      name: dto.name,
      adminEmail: dto.adminEmail,
      adminPassword: dto.adminPassword,
      cpfCnpj: dto.cpfCnpj ?? null,
      plan: dto.plan ?? 'free',
      status: 'ACTIVE',
    })
    // Post-commit, best-effort: billing provider link never blocks provisioning.
    await this.billing.ensureCustomerForTenant({
      tenantId: tenant.id,
      name: tenant.name,
      cpfCnpj: tenant.cpfCnpj,
      email: dto.adminEmail.toLowerCase(),
    })
    await this.sendWelcome(tenant, dto.adminEmail)
    return plainToInstance(TenantDto, tenant, { excludeExtraneousValues: true })
  }

  // Public self-service signup: paid plan only. Tenant is provisioned PENDING_PAYMENT
  // (storefront dark) and a subscription is created; it goes ACTIVE on the payment
  // webhook. Returns the Asaas invoice URL so the frontend can send the owner to pay.
  async signup(dto: SignupDto): Promise<TenantDto & { invoiceUrl: string | null }> {
    const tenant = await this.provision({
      slug: dto.slug,
      name: dto.name,
      adminEmail: dto.adminEmail,
      adminPassword: dto.adminPassword,
      cpfCnpj: dto.cpfCnpj,
      plan: dto.plan,
      status: 'PENDING_PAYMENT',
    })

    // Create the subscription now so the owner can pay right away. Unconfigured Asaas
    // throws BadRequest (checkout disabled) — surfaced to the caller; the tenant already
    // exists PENDING and can be paid later once billing is configured.
    let invoiceUrl: string | null = null
    try {
      const res = await this.billing.subscribeTenant(tenant.id, dto.plan)
      invoiceUrl = res.invoiceUrl
    } catch (e) {
      this.logger.error(`Signup ${tenant.slug}: subscription creation failed`, e as Error)
    }

    await this.sendWelcome(tenant, dto.adminEmail)
    return { ...plainToInstance(TenantDto, tenant, { excludeExtraneousValues: true }), invoiceUrl }
  }

  // Shared tenant + defaults provisioning in one atomic tx.
  private async provision(input: {
    slug: string
    name: string
    adminEmail: string
    adminPassword: string
    cpfCnpj: string | null
    plan: string
    status: 'ACTIVE' | 'PENDING_PAYMENT'
  }) {
    const slug = input.slug.toLowerCase()
    if (RESERVED_SLUGS.has(slug)) {
      throw new ConflictException('Slug reservado pela plataforma')
    }
    // Hash outside the tx — argon2id is intentionally slow (~100ms).
    const passwordHash = await UsersService.hash(input.adminPassword)

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.tenant.create({
          data: {
            slug,
            name: input.name,
            plan: input.plan,
            cpfCnpj: input.cpfCnpj,
            status: input.status,
          },
        })
        // Owned rows sit behind FORCE RLS — bind the new tenant's GUC to this tx.
        await tx.$executeRaw`SELECT set_config('app.current_tenant', ${created.id}, true)`

        await tx.shopConfig.create({
          data: { tenantId: created.id, shopName: input.name },
        })
        await tx.user.create({
          data: {
            tenantId: created.id,
            email: input.adminEmail.toLowerCase(),
            passwordHash,
            role: 'ADMIN',
          },
        })
        await tx.attributeDefinition.createMany({
          data: DEFAULT_ATTRIBUTES.map((a) => ({ ...a, tenantId: created.id })),
        })
        return created
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Slug já em uso')
      }
      throw e
    }
  }

  private async sendWelcome(tenant: { name: string; slug: string; plan: string }, adminEmail: string) {
    if (tenant.plan === 'demo') return
    await this.email.sendTransactional('welcome', adminEmail.toLowerCase(), {
      FIRST_NAME: tenant.name,
      SHOP_NAME: tenant.name,
      EMAIL: adminEmail.toLowerCase(),
      LOGIN_URL: tenantUrl(tenant.slug, '/admin'),
    })
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantDto> {
    const existing = await this.prisma.tenant.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Loja não encontrada')

    const tenant = await this.prisma.tenant.update({ where: { id }, data: dto })
    // Suspension/renames must bite now, not after the resolver cache TTL.
    await this.resolver.invalidateTenant(tenant)
    return plainToInstance(TenantDto, tenant, { excludeExtraneousValues: true })
  }
}
