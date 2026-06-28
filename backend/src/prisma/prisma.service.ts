import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { tenantExtension } from './tenant-extension'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Tenant-scoped client: auto-injects tenantId + sets RLS GUC per query.
  // Services read through this; the bare client is reserved for platform paths.
  readonly scoped = this.$extends(tenantExtension)

  constructor() {
    super({ log: ['warn', 'error'] })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
