import type { Ref } from '#imports'
import type {
  VehicleCreatePayload,
  VehicleDetail,
  VehicleListResponse,
  VehicleUpdatePayload,
} from '~/types/vehicle'

// All admin vehicle ops go through the Nuxt BFF (/api/admin/...), never the
// backend directly — the proxy injects the session bearer + handles refresh.
export function useAdminVehicles() {
  // List — useFetch so the admin list is SSR + reactive to filter refs.
  // `query` is a reactive ref; useFetch re-runs when it changes.
  function list(query: Ref<Record<string, unknown>>) {
    return useFetch<VehicleListResponse>('/api/admin/vehicles', {
      key: 'admin-veiculos-list',
      query,
      default: () => ({ items: [], total: 0, take: 24, skip: 0 }),
    })
  }

  // Detail (edit prefill). Imperative — caller awaits.
  function get(id: string) {
    return $fetch<VehicleDetail>(`/api/admin/vehicles/${id}`)
  }

  // Mutations — $fetch, triggered by submit/confirm.
  function create(body: VehicleCreatePayload) {
    return $fetch<VehicleDetail>('/api/admin/vehicles', { method: 'POST', body })
  }
  function update(id: string, body: VehicleUpdatePayload) {
    return $fetch<VehicleDetail>(`/api/admin/vehicles/${id}`, { method: 'PATCH', body })
  }
  function remove(id: string) {
    return $fetch<{ ok: true }>(`/api/admin/vehicles/${id}`, { method: 'DELETE' })
  }

  return { list, get, create, update, remove }
}
