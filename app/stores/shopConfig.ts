import type { PublicShopConfig } from '~/types/shop-config'

// Public shop identity (name, logo, description, address). Storefront-public —
// safe to hydrate into anonymous page source.
//
// SECURITY: only ever holds the PublicShopConfig subset. The /api/shop-config
// route strips the backend's `whatsappNumbers[]` (admin data) before it reaches
// this store. Do NOT add admin/lead fields here.
const DEFAULT_SHOP_NAME = 'Pherro'

export const useShopConfigStore = defineStore('shopConfig', () => {
  const shopName = ref<string>(DEFAULT_SHOP_NAME)
  const logoUrl = ref<string | null>(null)
  const description = ref<string | null>(null)
  const address = ref<string | null>(null)
  const loaded = ref(false)

  function apply(cfg: PublicShopConfig) {
    // Fall back to the default name so the UI never renders an empty brand.
    shopName.value = cfg.shopName?.trim() || DEFAULT_SHOP_NAME
    logoUrl.value = cfg.logoUrl
    description.value = cfg.description
    address.value = cfg.address
    loaded.value = true
  }

  async function fetchConfig() {
    // useRequestFetch forwards incoming headers during SSR — the BFF needs the
    // original Host to resolve the tenant; plain $fetch would drop it.
    const request = useRequestFetch()
    const cfg = await request<PublicShopConfig>('/api/shop-config')
    apply(cfg)
  }

  function $reset() {
    shopName.value = DEFAULT_SHOP_NAME
    logoUrl.value = null
    description.value = null
    address.value = null
    loaded.value = false
  }

  return { shopName, logoUrl, description, address, loaded, apply, fetchConfig, $reset }
})
