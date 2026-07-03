import type { Tenant, TenantCreatePayload, TenantUpdatePayload } from '~/types/tenant'

// All platform ops go through the Nuxt BFF (/api/platform/tenants) — the proxy
// enforces the PLATFORM_ADMIN session and injects the bearer + refresh.
export function usePlatformTenants() {
  function list(key = 'platform-tenants-list') {
    return useFetch<Tenant[]>('/api/platform/tenants', {
      key,
      default: () => [],
    })
  }

  function create(body: TenantCreatePayload) {
    return $fetch<Tenant>('/api/platform/tenants', { method: 'POST', body })
  }
  function update(id: string, body: TenantUpdatePayload) {
    return $fetch<Tenant>(`/api/platform/tenants/${id}`, { method: 'PATCH', body })
  }

  return { list, create, update }
}
