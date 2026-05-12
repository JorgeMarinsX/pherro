<script setup lang="ts">
// TODO: load shopName + logoUrl from ShopConfig via API once endpoint exists.
const shopName = 'Pherro'

const items = ref([
  { label: 'Início', to: '/', icon: 'i-lucide-home' },
  { label: 'Veículos', to: '/veiculos', icon: 'i-lucide-car-front' },
  { label: 'Contato', to: '/contato', icon: 'i-lucide-mail' },
])
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
    <UContainer class="flex items-center justify-between gap-4 py-3">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-neutral-900"
      >
        <UIcon name="i-lucide-car-front" class="size-7 text-primary-600" />
        <span class="text-xl font-extrabold tracking-tight">{{ shopName }}</span>
      </NuxtLink>

      <UNavigationMenu
        :items="items"
        variant="link"
        color="neutral"
        class="hidden md:flex"
      />

      <div class="flex items-center gap-2">
        <UButton
          to="/contato"
          color="primary"
          icon="i-lucide-phone"
          label="Fale conosco"
          class="hidden sm:inline-flex"
        />
        <UButton
          to="/contato"
          color="primary"
          icon="i-lucide-phone"
          variant="ghost"
          aria-label="Fale conosco"
          class="sm:hidden"
        />
      </div>
    </UContainer>
  </header>
</template>
