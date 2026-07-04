import type { Ref } from '#imports'
import type { Lead, LeadListResponse } from '~/types/lead'

// All admin lead ops go through the Nuxt BFF (/api/admin/...), never the backend
// directly — the proxy injects the session bearer (tenant-scoped) + handles refresh.
export function useAdminLeads() {
  // List — useFetch so the table is SSR + reactive to filter refs.
  function list(query: Ref<Record<string, unknown>>, key = 'admin-leads-list') {
    return useFetch<LeadListResponse>('/api/admin/leads', {
      key,
      query,
      default: () => ({ items: [], total: 0, take: 50, skip: 0 }),
    })
  }

  function get(id: string) {
    return $fetch<Lead>(`/api/admin/leads/${id}`)
  }

  // Export helper: pull every lead matching the filters by paging the backend
  // (server caps take at 100). Same scoped endpoint → still tenant-isolated.
  async function fetchAll(filters: Record<string, unknown> = {}): Promise<Lead[]> {
    const PAGE = 100
    const all: Lead[] = []
    let skip = 0
    for (;;) {
      const res = await $fetch<LeadListResponse>('/api/admin/leads', {
        query: { ...filters, take: PAGE, skip },
      })
      all.push(...res.items)
      skip += PAGE
      if (all.length >= res.total || res.items.length === 0) break
    }
    return all
  }

  return { list, get, fetchAll }
}
