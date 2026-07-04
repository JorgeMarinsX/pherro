import { Injectable, Logger } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { AuthService } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { DEFAULT_ATTRIBUTES } from './platform-tenants.service'

// Ephemeral demo tenants: one per visitor browser session (demo.<base domain>).
// Never billed, never listed as real customers — plan 'demo' + slug 'demo-*'.
// Discard model: the BFF cookie dies with the browser window; the rows are
// garbage-collected here on the next demo bootstrap (TTL sweep).
const DEMO_PLAN = 'demo'
const DEMO_SLUG_PREFIX = 'demo-'
const DEMO_ADMIN_EMAIL = 'demo@pherro.app'
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000

const DEMO_SHOP = {
  name: 'AutoDemo Veículos',
  description:
    'Loja de demonstração da plataforma Pherro. Todos os veículos, leads e configurações são fictícios — edite à vontade, nada aqui é permanente.',
  address: 'Av. Paulista, 1000 — São Paulo/SP',
  whatsapp: { label: 'Vendas', number: '+5511999999999' },
}

type DemoVehicle = {
  slug: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  color: string
  description: string
  transmission: 'MANUAL' | 'AUTOMATIC' | 'CVT'
  fuelType: 'FLEX' | 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'ELECTRIC'
  photos: string[]
}

const DEMO_VEHICLES: DemoVehicle[] = [
  {
    slug: 'volkswagen-nivus-highline-2023',
    make: 'Volkswagen',
    model: 'Nivus Highline',
    year: 2023,
    price: 119900,
    mileage: 28450,
    color: 'Branco',
    description:
      'SUV cupê compacto, motor 1.0 TSI turbo, central multimídia VW Play, faróis full LED. Único dono, todas revisões em concessionária.',
    transmission: 'AUTOMATIC',
    fuelType: 'FLEX',
    photos: [
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200',
      'https://images.unsplash.com/photo-1549924231-f129b911e442?w=1200',
    ],
  },
  {
    slug: 'toyota-corolla-xei-2022',
    make: 'Toyota',
    model: 'Corolla XEi',
    year: 2022,
    price: 134500,
    mileage: 41200,
    color: 'Prata',
    description:
      'Sedan médio, câmbio CVT, bancos em couro, sete airbags, controle de cruzeiro adaptativo. Procedência garantida.',
    transmission: 'CVT',
    fuelType: 'FLEX',
    photos: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200',
      'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=1200',
    ],
  },
  {
    slug: 'honda-civic-touring-2021',
    make: 'Honda',
    model: 'Civic Touring',
    year: 2021,
    price: 142900,
    mileage: 53800,
    color: 'Preto',
    description:
      'Motor 1.5 turbo, câmbio CVT, teto solar, bancos elétricos com memória, Honda Sensing completo.',
    transmission: 'CVT',
    fuelType: 'GASOLINE',
    photos: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200'],
  },
  {
    slug: 'jeep-compass-limited-2024',
    make: 'Jeep',
    model: 'Compass Limited',
    year: 2024,
    price: 189900,
    mileage: 12300,
    color: 'Cinza',
    description:
      'SUV diesel 2.0 turbo 4x4, automático 9 marchas, bancos em couro, central 10.1", garantia de fábrica vigente.',
    transmission: 'AUTOMATIC',
    fuelType: 'DIESEL',
    photos: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200',
    ],
  },
  {
    slug: 'fiat-pulse-impetus-2023',
    make: 'Fiat',
    model: 'Pulse Impetus',
    year: 2023,
    price: 98500,
    mileage: 22100,
    color: 'Vermelho',
    description:
      'SUV compacto, motor 1.0 turbo 200, câmbio CVT, central 10.1" com Android Auto e CarPlay sem fio.',
    transmission: 'CVT',
    fuelType: 'FLEX',
    photos: ['https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200'],
  },
  {
    slug: 'chevrolet-onix-premier-2022',
    make: 'Chevrolet',
    model: 'Onix Premier',
    year: 2022,
    price: 89900,
    mileage: 38700,
    color: 'Branco',
    description:
      'Hatch motor 1.0 turbo, câmbio automático 6 marchas, central MyLink 8", rodas liga leve 16".',
    transmission: 'AUTOMATIC',
    fuelType: 'FLEX',
    photos: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200'],
  },
]

// Sample leads so the CRM screens aren't empty. vehicleIndex → DEMO_VEHICLES.
const DEMO_LEADS = [
  {
    name: 'Carlos Eduardo Souza',
    phone: '+5511987654321',
    email: 'carlos.souza@example.com',
    notes: 'Quer trocar o carro atual na negociação. Prefere contato à tarde.',
    source: 'FORM' as const,
    vehicleIndex: 0,
  },
  {
    name: 'Mariana Lima',
    phone: '+5511976543210',
    email: 'mariana.lima@example.com',
    notes: 'Perguntou sobre financiamento em 48x.',
    source: 'FORM' as const,
    vehicleIndex: 1,
  },
  {
    name: 'Roberto Almeida',
    phone: '+5511965432109',
    email: null,
    notes: 'Cliente antigo da loja, indicado pelo João.',
    source: 'MANUAL' as const,
    vehicleIndex: 3,
  },
]

export type DemoSessionResult = {
  tenantId: string
  slug: string
  accessToken: string
  refreshToken: string
  email: string
  role: 'ADMIN'
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  // Re-issue admin tokens for an existing demo tenant (cookie survived, session
  // cookie didn't — e.g. logout inside the demo). Null → caller creates fresh.
  async reissue(tenantId: string): Promise<DemoSessionResult | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, plan: true, status: true },
    })
    if (!tenant || tenant.plan !== DEMO_PLAN || tenant.status !== 'ACTIVE') return null
    if (!tenant.slug.startsWith(DEMO_SLUG_PREFIX)) return null

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenant.id}, true)`
      return tx.user.findFirst({ where: { tenantId: tenant.id, role: 'ADMIN', isActive: true } })
    })
    if (!user) return null

    return this.toResult(tenant, await this.issueTokensFor(user))
  }

  // New ephemeral tenant, fully seeded, admin tokens included (auto-login).
  async create(): Promise<DemoSessionResult> {
    await this.sweep()

    const slug = DEMO_SLUG_PREFIX + randomBytes(6).toString('hex')
    // Random throwaway password — never shown; access is via issued tokens only.
    const passwordHash = await UsersService.hash(randomBytes(24).toString('hex'))

    const { tenant, user } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: { slug, name: DEMO_SHOP.name, plan: DEMO_PLAN },
      })
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${created.id}, true)`

      const shop = await tx.shopConfig.create({
        data: {
          tenantId: created.id,
          shopName: DEMO_SHOP.name,
          description: DEMO_SHOP.description,
          address: DEMO_SHOP.address,
        },
      })
      const admin = await tx.user.create({
        data: { tenantId: created.id, email: DEMO_ADMIN_EMAIL, passwordHash, role: 'ADMIN' },
      })
      const whatsapp = await tx.whatsappNumber.create({
        data: {
          tenantId: created.id,
          label: DEMO_SHOP.whatsapp.label,
          number: DEMO_SHOP.whatsapp.number,
          isActive: true,
          shopConfigId: shop.id,
        },
      })
      await tx.attributeDefinition.createMany({
        data: DEFAULT_ATTRIBUTES.map((a) => ({ ...a, tenantId: created.id })),
      })
      const attributes = await tx.attributeDefinition.findMany({
        where: { tenantId: created.id },
        select: { id: true, slug: true },
      })
      const commonAttrs = attributes.filter((a) =>
        ['ar-condicionado', 'airbag', 'vidros-eletricos', 'travas-eletricas'].includes(a.slug),
      )

      const vehicleIds: string[] = []
      for (const v of DEMO_VEHICLES) {
        const vehicle = await tx.vehicle.create({
          data: {
            tenantId: created.id,
            slug: v.slug,
            make: v.make,
            model: v.model,
            year: v.year,
            price: v.price,
            mileage: v.mileage,
            color: v.color,
            description: v.description,
            transmission: v.transmission,
            fuelType: v.fuelType,
            whatsappNumberId: whatsapp.id,
            photos: {
              create: v.photos.map((url, i) => ({ tenantId: created.id, url, position: i })),
            },
            attributes: {
              create: commonAttrs.map((a) => ({
                tenantId: created.id,
                attributeDefinitionId: a.id,
                value: 'true',
              })),
            },
          },
          select: { id: true },
        })
        vehicleIds.push(vehicle.id)
      }

      for (const lead of DEMO_LEADS) {
        const vehicleId = vehicleIds[lead.vehicleIndex]
        await tx.lead.create({
          data: {
            tenantId: created.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            notes: lead.notes,
            source: lead.source,
            ...(vehicleId
              ? { vehicleInterests: { create: { tenantId: created.id, vehicleId } } }
              : {}),
          },
        })
      }

      return { tenant: created, user: admin }
    })

    return this.toResult(tenant, await this.issueTokensFor(user))
  }

  // GC: demo tenants past TTL are orphans (their browser sessions are gone).
  // Cascading FKs wipe every owned row. Best-effort — never blocks a bootstrap.
  private async sweep(): Promise<void> {
    const ttl = Number(process.env.DEMO_TENANT_TTL_MS) || DEFAULT_TTL_MS
    try {
      const { count } = await this.prisma.tenant.deleteMany({
        where: {
          plan: DEMO_PLAN,
          slug: { startsWith: DEMO_SLUG_PREFIX },
          createdAt: { lt: new Date(Date.now() - ttl) },
        },
      })
      if (count > 0) this.logger.log(`Swept ${count} expired demo tenant(s)`)
    } catch (e) {
      this.logger.warn(`Demo sweep failed: ${e instanceof Error ? e.message : e}`)
    }
  }

  private issueTokensFor(user: { id: string; email: string; tenantId: string | null }) {
    return this.auth.issueTokens({
      sub: user.id,
      email: user.email,
      role: 'ADMIN',
      tenantId: user.tenantId,
      isPlatformAdmin: false,
    })
  }

  private toResult(
    tenant: { id: string; slug: string },
    tokens: { accessToken: string; refreshToken: string; email: string },
  ): DemoSessionResult {
    return {
      tenantId: tenant.id,
      slug: tenant.slug,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      email: tokens.email,
      role: 'ADMIN',
    }
  }
}
