import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const shopName = process.env.TENANT_SLUG ?? 'dev'
  const existing = await prisma.shopConfig.findFirst()
  if (!existing) {
    await prisma.shopConfig.create({ data: { shopName } })
    console.log(`[seed] ShopConfig created with shopName='${shopName}'.`)
  } else {
    console.log(`[seed] ShopConfig already exists, skipping.`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
