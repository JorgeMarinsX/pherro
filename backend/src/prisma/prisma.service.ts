import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { TenantContext } from '../tenant/tenant-context'
import { tenantExtension } from './tenant-extension'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Tenant-scoped client: auto-injects tenantId + binds RLS GUC per query.
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

  // Atomic multi-statement work in one tenant: bind GUC once, run callback.
  async runInTenantTx<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const tenantId = TenantContext.tenantId()
    TenantContext.setInTenantTx(true)
    try {
      return await this.scoped.$transaction(async (tx: any) => {
        if (tenantId) {
          await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`
        }
        return fn(tx)
      })
    } finally {
      TenantContext.setInTenantTx(false)
    }
  }
}
