<script setup lang="ts">
const shop = useShopConfigStore()
// Fetched at layout level so the tenant theme (color ramp + favicon) is in the
// SSR head before any child renders. SiteHeader reads the same store.
await callOnce('shop-config', () => shop.fetchConfig())
useTenantTheme()

useHead({
  htmlAttrs: { class: '[scrollbar-gutter:stable]' },
  bodyAttrs: { class: 'bg-white' },
})
</script>

<template>
    <div class="w-full min-h-screen">
    <SiteHeader />
    <slot />
    </div>
</template>
