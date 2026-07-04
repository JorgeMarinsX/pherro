import type { Ref } from '#imports'
import type {
  Vehicle,
  VehicleCreatePayload,
  VehicleDetail,
  VehicleListResponse,
  VehicleUpdatePayload,
} from '~/types/vehicle'

// All admin vehicle ops go through the Nuxt BFF (/api/admin/...), never the
// backend directly — the proxy injects the session bearer + handles refresh.
export function useAdminVehicles() {
  // List — useFetch so the admin list is SSR + reactive to filter refs.
  // `query` is a reactive ref; useFetch re-runs when it changes. Pass a distinct
  // `key` when calling from a different page so the dashboard count and the
  // anúncios table don't share/overwrite each other's payload.
  function list(query: Ref<Record<string, unknown>>, key = 'admin-veiculos-list') {
    return useFetch<VehicleListResponse>('/api/admin/vehicles', {
      key,
      query,
      default: () => ({ items: [], total: 0, take: 24, skip: 0 }),
    })
  }

  // Detail (edit prefill). Imperative — caller awaits.
  function get(id: string) {
    return $fetch<VehicleDetail>(`/api/admin/vehicles/${id}`)
  }

  // Export helper: pull every vehicle matching the filters by paging the backend.
  // Same scoped BFF endpoint → still tenant-isolated. Backend caps take at 100.
  async function fetchAll(filters: Record<string, unknown> = {}): Promise<Vehicle[]> {
    const PAGE = 100
    const all: Vehicle[] = []
    let skip = 0
    for (;;) {
      const res = await $fetch<VehicleListResponse>('/api/admin/vehicles', {
        query: { ...filters, take: PAGE, skip },
      })
      all.push(...res.items)
      skip += PAGE
      if (all.length >= res.total || res.items.length === 0) break
    }
    return all
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

  return { list, get, fetchAll, create, update, remove }
}
