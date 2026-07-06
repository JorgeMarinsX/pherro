// Frontend never imports @prisma/client (index.md §6). Mirror of the backend
// ShopConfigDto, split by exposure boundary.

// Full DTO as the backend returns it from GET /shop-config. The embedded
// `whatsappNumbers` carries every number (incl. inactive ones, labels and
// internal descriptions) = admin data. NEVER hydrate this whole shape into a
// storefront store.
export interface ShopConfig {
  id: string
  shopName: string
  logoUrl: string | null
  heroImageUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  description: string | null
  address: string | null
  whatsappNumbers: ShopConfigWhatsapp[]
}

export interface ShopConfigWhatsapp {
  id: string
  label: string
  description: string | null
  number: string
  isActive: boolean
}

// Storefront-safe subset. This is the only shape allowed into a store that a
// public route touches — genuinely-public identity fields, nothing else. The
// active WhatsApp CTA number comes from /api/whatsapp-active, not from here.
export interface PublicShopConfig {
  shopName: string
  logoUrl: string | null
  heroImageUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  description: string | null
  address: string | null
}

// Branding image kinds handled by POST/DELETE /api/admin/uploads/branding/:kind.
// Image URLs are NOT part of the PATCH payload — the upload endpoints own them.
export type BrandingKind = 'logo' | 'hero' | 'favicon'

// Editable fields for the admin Configurações form. Sent explicitly to the BFF
// (never spread raw — forbidNonWhitelisted 400s on extras).
export interface ShopConfigFormState {
  shopName: string
  primaryColor: string
  description: string
  address: string
}

export type ShopConfigUpdatePayload = Partial<{
  shopName: string
  primaryColor: string | null
  description: string | null
  address: string | null
}>
