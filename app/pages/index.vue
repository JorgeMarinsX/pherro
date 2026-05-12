<script setup lang="ts">
import type { Vehicle } from '~/types/vehicle'

useSeoMeta({
  title: 'Pherro — Veículos Seminovos',
  description: 'Encontre o carro ideal. Estoque selecionado de veículos seminovos com procedência garantida.',
})

// TODO: replace with real fetch once API endpoint exists.
// Example shape:
//   const { data: vehicles } = await useFetch<Vehicle[]>('/api/vehicles', {
//     query: { status: 'ACTIVE', q: searchQuery },
//   })
const vehicles = ref<Vehicle[]>([])

const searchQuery = ref('')

// TODO: wire search to API query param. Currently filters client-side only.
const filteredVehicles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return vehicles.value
  return vehicles.value.filter((v: Vehicle) =>
    `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q),
  )
})

function onSearch() {
  // TODO: trigger API refetch with searchQuery.
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <SiteHeader />

    <section class="relative isolate overflow-hidden bg-black text-white">
      <div
        class="absolute inset-0 -z-10 bg-cover bg-center opacity-40"
        style="background-image: url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=80');"
      />
      <div class="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/60 to-black" />

      <div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div class="mx-auto max-w-3xl text-center">
          <h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Encontre o carro
            <span class="text-[#8B1A1A]">perfeito</span>
            para você
          </h1>
          <p class="mt-4 text-base text-neutral-300 sm:text-lg">
            Estoque selecionado de veículos seminovos com procedência garantida.
          </p>

          <form
            class="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
            @submit.prevent="onSearch"
          >
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              size="xl"
              placeholder="Busque por marca, modelo ou ano..."
              class="flex-1"
              :ui="{ base: 'bg-white text-black' }"
            />
            <UButton
              type="submit"
              color="primary"
              size="xl"
              icon="i-lucide-search"
            >
              Buscar
            </UButton>
          </form>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <h2 class="text-2xl font-bold text-black sm:text-3xl">
            Anúncios em destaque
          </h2>
          <p class="mt-1 text-sm text-neutral-600">
            Confira os veículos disponíveis no nosso estoque.
          </p>
        </div>
        <NuxtLink
          to="/veiculos"
          class="hidden text-sm font-medium text-[#8B1A1A] hover:underline sm:inline-flex"
        >
          Ver todos →
        </NuxtLink>
      </div>

      <div
        v-if="filteredVehicles.length > 0"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <VehicleCard
          v-for="vehicle in filteredVehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
        />
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-20 text-center"
      >
        <UIcon name="i-lucide-car-front" class="size-12 text-neutral-400" />
        <p class="mt-4 text-lg font-medium text-black">
          Nenhum anúncio disponível
        </p>
        <p class="mt-1 text-sm text-neutral-600">
          Em breve novos veículos no estoque.
        </p>
      </div>
    </section>
  </div>
</template>
