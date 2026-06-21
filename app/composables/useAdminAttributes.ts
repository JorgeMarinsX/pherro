import type {
  AttributeCreatePayload,
  AttributeDefinition,
  AttributeUpdatePayload,
} from '~/types/attribute'

// All admin attribute ops go through the Nuxt BFF (/api/admin/attributes),
// never the backend directly — the proxy injects the session bearer + refresh.
export function useAdminAttributes() {
  // List — useFetch so the admin page is SSR + reactive/refreshable.
  function list(key = 'admin-attributes-list') {
    return useFetch<AttributeDefinition[]>('/api/admin/attributes', {
      key,
      default: () => [],
    })
  }

  // Mutations — $fetch, triggered by submit/confirm.
  function create(body: AttributeCreatePayload) {
    return $fetch<AttributeDefinition>('/api/admin/attributes', { method: 'POST', body })
  }
  function update(id: string, body: AttributeUpdatePayload) {
    return $fetch<AttributeDefinition>(`/api/admin/attributes/${id}`, { method: 'PATCH', body })
  }
  function remove(id: string) {
    return $fetch<{ ok: true }>(`/api/admin/attributes/${id}`, { method: 'DELETE' })
  }

  return { list, create, update, remove }
}
