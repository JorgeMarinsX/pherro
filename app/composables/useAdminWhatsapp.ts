import type {
  VehicleWhatsapp,
  WhatsappCreatePayload,
  WhatsappUpdatePayload,
} from '~/types/vehicle'

// All admin WhatsApp-number ops go through the Nuxt BFF (/api/admin/whatsapp),
// never the backend directly — the proxy injects the session bearer + refresh.
export function useAdminWhatsapp() {
  // List — useFetch so the admin page is SSR + reactive/refreshable.
  function list(key = 'admin-whatsapp-list') {
    return useFetch<VehicleWhatsapp[]>('/api/admin/whatsapp', {
      key,
      default: () => [],
    })
  }

  // Mutations — $fetch, triggered by submit/confirm.
  function create(body: WhatsappCreatePayload) {
    return $fetch<VehicleWhatsapp>('/api/admin/whatsapp', { method: 'POST', body })
  }
  function update(id: string, body: WhatsappUpdatePayload) {
    return $fetch<VehicleWhatsapp>(`/api/admin/whatsapp/${id}`, { method: 'PATCH', body })
  }
  function activate(id: string) {
    return $fetch<VehicleWhatsapp>(`/api/admin/whatsapp/${id}/activate`, { method: 'PATCH' })
  }
  function remove(id: string) {
    return $fetch<{ ok: true }>(`/api/admin/whatsapp/${id}`, { method: 'DELETE' })
  }

  return { list, create, update, activate, remove }
}
