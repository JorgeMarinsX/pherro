// Storefront-only tenant branding: remaps the primary ramp to the shop's
// custom color and sets the favicon. SSR-rendered via useHead — no flash.
// Tenant admin + platform surfaces keep their fixed themes.
export function useTenantTheme() {
  const shop = useShopConfigStore()

  useHead({
    style: computed(() => {
      const css = shop.primaryColor ? primaryRampCss(shop.primaryColor) : null
      return css ? [{ key: 'tenant-theme', textContent: css }] : []
    }),
    link: computed(() =>
      shop.faviconUrl ? [{ key: 'favicon', rel: 'icon', href: shop.faviconUrl }] : [],
    ),
  })
}
