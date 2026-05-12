import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const slug = process.env.TENANT_SLUG ?? 'dev'
  await prisma.tenantConfig.upsert({
    where: { slug },
    update: {},
    create: { slug, name: slug },
  })
  console.log(`[seed] tenant '${slug}' ensured.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
