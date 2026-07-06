import type { ShopConfig, PublicShopConfig } from '~~/app/types/shop-config'
import { backendFetch } from '~~/server/utils/backend'

// Public storefront shop config. Backend GET /shop-config is @Public().
//
// SECURITY: the backend DTO embeds `whatsappNumbers[]` — every number incl.
// inactive ones, labels and internal descriptions = admin data. The storefront
// store hydrates into anonymous page source, so we strip it here. Only
// genuinely-public identity fields cross the wire. The active WhatsApp number
// for CTAs comes from /api/whatsapp-active, not this.
export default defineEventHandler(async (event): Promise<PublicShopConfig> => {
  const cfg = await backendFetch<ShopConfig>(event, '/shop-config')
  return {
    shopName: cfg.shopName,
    logoUrl: cfg.logoUrl,
    heroImageUrl: cfg.heroImageUrl,
    faviconUrl: cfg.faviconUrl,
    primaryColor: cfg.primaryColor,
    description: cfg.description,
    address: cfg.address,
  }
})
