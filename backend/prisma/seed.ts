import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function kebab(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function slugFor(make: string, model: string, year: number, salt: string): string {
  return `${kebab(make)}-${kebab(model)}-${year}-${salt}`
}

type SeedVehicle = {
  salt: string
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

const VEHICLES: SeedVehicle[] = [
  {
    salt: 'a1b2c3',
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
    salt: 'd4e5f6',
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
    salt: 'g7h8i9',
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
    photos: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200',
    ],
  },
  {
    salt: 'j0k1l2',
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
    salt: 'm3n4o5',
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
    photos: [
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200',
    ],
  },
  {
    salt: 'p6q7r8',
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
    photos: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200',
    ],
  },
]

async function main() {
  const slug = process.env.TENANT_SLUG ?? 'dev'

  // Tenant is unscoped (no RLS) — create/find it on the bare client.
  const tenant =
    (await prisma.tenant.findUnique({ where: { slug } })) ??
    (await prisma.tenant.create({ data: { slug, name: slug } }))
  console.log(`[seed] Tenant '${slug}' (${tenant.id}).`)

  // All owned rows live behind RLS: bind the GUC for this transaction, then write.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenant.id}, true)`

    let shop = await tx.shopConfig.findFirst()
    if (!shop) {
      shop = await tx.shopConfig.create({ data: { tenantId: tenant.id, shopName: slug } })
      console.log(`[seed] ShopConfig created.`)
    }

    let whatsapp = await tx.whatsappNumber.findFirst({ where: { shopConfigId: shop.id } })
    if (!whatsapp) {
      whatsapp = await tx.whatsappNumber.create({
        data: {
          tenantId: tenant.id,
          label: 'Vendas',
          number: '+5511999999999',
          isActive: true,
          shopConfigId: shop.id,
        },
      })
      console.log(`[seed] WhatsappNumber created.`)
    }

    let created = 0
    let skipped = 0
    for (const v of VEHICLES) {
      const vslug = slugFor(v.make, v.model, v.year, v.salt)
      const existing = await tx.vehicle.findFirst({ where: { tenantId: tenant.id, slug: vslug } })
      if (existing) {
        skipped++
        continue
      }
      await tx.vehicle.create({
        data: {
          tenantId: tenant.id,
          slug: vslug,
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
            create: v.photos.map((url, i) => ({ tenantId: tenant.id, url, position: i })),
          },
        },
      })
      created++
    }
    console.log(`[seed] Vehicles: created=${created}, skipped=${skipped}.`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
