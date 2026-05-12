<script setup lang="ts">
// TODO: load shopName + logoUrl from ShopConfig via API once endpoint exists.
const shopName = 'Pherro'

const nav = [
  { label: 'Início', to: '/' },
  { label: 'Veículos', to: '/veiculos' },
  { label: 'Contato', to: '/contato' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-neutral-200 bg-black/95 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="flex items-center gap-2 text-white">
        <UIcon name="i-lucide-car-front" class="size-6 text-[#8B1A1A]" />
        <span class="text-lg font-bold tracking-tight">{{ shopName }}</span>
      </NuxtLink>

      <nav class="hidden items-center gap-6 md:flex">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="text-sm font-medium text-neutral-300 transition hover:text-white"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <UButton
        to="/contato"
        color="primary"
        icon="i-lucide-phone"
        class="hidden sm:inline-flex"
      >
        Fale conosco
      </UButton>

      <UButton
        to="/contato"
        color="primary"
        icon="i-lucide-phone"
        variant="ghost"
        class="sm:hidden"
        aria-label="Fale conosco"
      />
    </div>
  </header>
</template>
