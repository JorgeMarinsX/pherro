import { AsyncLocalStorage } from 'node:async_hooks'

export type TenantStore = {
  tenantId: string | null
  isPlatformAdmin: boolean
}

const als = new AsyncLocalStorage<TenantStore>()

export const TenantContext = {
  run<T>(store: TenantStore, fn: () => T): T {
    return als.run(store, fn)
  },

  store(): TenantStore | undefined {
    return als.getStore()
  },

  tenantId(): string | null {
    return als.getStore()?.tenantId ?? null
  },

  isPlatformAdmin(): boolean {
    return als.getStore()?.isPlatformAdmin ?? false
  },

  setTenantId(tenantId: string | null): void {
    const s = als.getStore()
    if (s) s.tenantId = tenantId
  },

  setPlatformAdmin(value: boolean): void {
    const s = als.getStore()
    if (s) s.isPlatformAdmin = value
  },
}
