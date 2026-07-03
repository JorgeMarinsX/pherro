// One-off prod bootstrap: upserts the PlatformAdmin from PLATFORM_ADMIN_EMAIL/PASSWORD.
// Run: docker compose -f docker-compose.prod.yml run --rm backend bun run scripts/create-platform-admin.ts
import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const

async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase()
  const password = process.env.PLATFORM_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are required')
  }
  if (password.length < 12) {
    throw new Error('PLATFORM_ADMIN_PASSWORD must be at least 12 characters')
  }

  const passwordHash = await argon2.hash(password, ARGON_OPTS)
  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash, isActive: true },
  })
  console.log(`[platform-admin] '${admin.email}' ready.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
