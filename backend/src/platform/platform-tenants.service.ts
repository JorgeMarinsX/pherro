import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { TenantResolverService } from '../tenant/tenant-resolver.service'
import { UsersService } from '../users/users.service'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { TenantDto } from './dto/tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'

// Subdomains that must never become tenant sites.
const RESERVED_SLUGS = new Set([
  'app', 'www', 'api', 'admin', 'platform', 'mail', 'smtp', 'static', 'cdn', 'assets', 'status',
])

const DEFAULT_ATTRIBUTES = [
  { name: 'Ar-condicionado', slug: 'ar-condicionado', icon: 'i-lucide-snowflake', type: 'BOOLEAN' },
  { name: 'Direção hidráulica', slug: 'direcao-hidraulica', icon: 'i-lucide-circle-dot', type: 'BOOLEAN' },
  { name: 'Vidros elétricos', slug: 'vidros-eletricos', icon: 'i-lucide-square-chevron-up', type: 'BOOLEAN' },
  { name: 'Travas elétricas', slug: 'travas-eletricas', icon: 'i-lucide-lock', type: 'BOOLEAN' },
  { name: 'Airbag', slug: 'airbag', icon: 'i-lucide-shield', type: 'BOOLEAN' },
  { name: 'Câmera de ré', slug: 'camera-de-re', icon: 'i-lucide-camera', type: 'BOOLEAN' },
] as const

@Injectable()
export class PlatformTenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: TenantResolverService,
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

  // Provisioning: tenant row + seeded defaults, one atomic tx. No deploy needed.
  async create(dto: CreateTenantDto): Promise<TenantDto> {
    const slug = dto.slug.toLowerCase()
    if (RESERVED_SLUGS.has(slug)) {
      throw new ConflictException('Slug reservado pela plataforma')
    }
    // Hash outside the tx — argon2id is intentionally slow (~100ms).
    const passwordHash = await UsersService.hash(dto.adminPassword)

    try {
      const tenant = await this.prisma.$transaction(async (tx) => {
        const created = await tx.tenant.create({
          data: { slug, name: dto.name, plan: dto.plan ?? 'free' },
        })
        // Owned rows sit behind FORCE RLS — bind the new tenant's GUC to this tx.
        await tx.$executeRaw`SELECT set_config('app.current_tenant', ${created.id}, true)`

        await tx.shopConfig.create({
          data: { tenantId: created.id, shopName: dto.name },
        })
        await tx.user.create({
          data: {
            tenantId: created.id,
            email: dto.adminEmail.toLowerCase(),
            passwordHash,
            role: 'ADMIN',
          },
        })
        await tx.attributeDefinition.createMany({
          data: DEFAULT_ATTRIBUTES.map((a) => ({ ...a, tenantId: created.id })),
        })
        return created
      })
      return plainToInstance(TenantDto, tenant, { excludeExtraneousValues: true })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Slug já em uso')
      }
      throw e
    }
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
