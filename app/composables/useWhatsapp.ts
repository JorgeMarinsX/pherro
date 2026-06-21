import type { VehicleWhatsapp } from '~/types/vehicle'

// Resolve the single ACTIVE WhatsApp number (SSR + client) and build send URLs
// for any storefront surface. The active number is the only source for CTA URLs
// (per-vehicle override is intentionally ignored).
export function useWhatsapp() {
  const { data: activeNumber } = useFetch<VehicleWhatsapp | null>('/api/whatsapp-active', {
    key: 'whatsapp-active',
    default: () => null,
  })

  // Returns a ready wa send URL for the given message, or null if no active number.
  function urlFor(message: string): string | null {
    const num = activeNumber.value?.number
    return num ? buildWhatsappUrl(num, message) : null
  }

  return { activeNumber, urlFor }
}
