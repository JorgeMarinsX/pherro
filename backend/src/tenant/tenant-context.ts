import { AsyncLocalStorage } from 'node:async_hooks'

export type TenantStore = {
  tenantId: string | null
  isPlatformAdmin: boolean
  // GUC already bound to an outer tx → extension skips its per-op tx wrap.
  inTenantTx: boolean
  // Resolved tenant lifecycle status. PENDING_PAYMENT tenants get a context (so their
  // admin can log in and pay) but the public storefront stays gated — see ActiveTenantGuard.
  status: 'ACTIVE' | 'PENDING_PAYMENT' | 'SUSPENDED' | null
}

const als = new AsyncLocalStorage<TenantStore>()

export const TenantContext = {
  run<T>(store: TenantStore, fn: () => T): T {
    return als.run(store, fn)
  },

  // Fastify/middie: the route handler runs OUTSIDE run(store, next)'s scope,
  // so the middleware must bind the store to the request's async context instead.
  enterWith(store: TenantStore): void {
    als.enterWith(store)
  },

  store(): TenantStore | undefined {
    return als.getStore()
  },

  tenantId(): string | null {
    return als.getStore()?.tenantId ?? null
  },

  status(): TenantStore['status'] {
    return als.getStore()?.status ?? null
  },

  isPlatformAdmin(): boolean {
    return als.getStore()?.isPlatformAdmin ?? false
  },

  inTenantTx(): boolean {
    return als.getStore()?.inTenantTx ?? false
  },

  setTenantId(tenantId: string | null): void {
    const s = als.getStore()
    if (s) s.tenantId = tenantId
  },

  setPlatformAdmin(value: boolean): void {
    const s = als.getStore()
    if (s) s.isPlatformAdmin = value
  },

  setInTenantTx(value: boolean): void {
    const s = als.getStore()
    if (s) s.inTenantTx = value
  },

  setStatus(value: TenantStore['status']): void {
    const s = als.getStore()
    if (s) s.status = value
  },
}
