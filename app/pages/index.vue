<script setup lang="ts">
import type { Vehicle } from '~/types/vehicle'

useSeoMeta({
  title: 'Pherro — Veículos Seminovos',
  description: 'Encontre o carro ideal. Estoque selecionado de veículos seminovos com procedência garantida.',
})

// TODO: replace mock data with `useFetch<Vehicle[]>('/api/vehicles', { query: { status: 'ACTIVE' } })`.
const vehicles = ref<Vehicle[]>([
  {
    id: 'mock-1',
    make: 'Volkswagen',
    model: 'Nivus Highline',
    year: 2023,
    price: 119900,
    mileage: 28450,
    color: 'Branco',
    transmission: 'AUTOMATIC',
    fuelType: 'FLEX',
    status: 'ACTIVE',
    photos: [],
  },
  {
    id: 'mock-2',
    make: 'Toyota',
    model: 'Corolla XEi',
    year: 2022,
    price: 134500,
    mileage: 41200,
    color: 'Prata',
    transmission: 'CVT',
    fuelType: 'FLEX',
    status: 'ACTIVE',
    photos: [],
  },
  {
    id: 'mock-3',
    make: 'Honda',
    model: 'Civic Touring',
    year: 2021,
    price: 142900,
    mileage: 53800,
    color: 'Preto',
    transmission: 'CVT',
    fuelType: 'GASOLINE',
    status: 'ACTIVE',
    photos: [],
  },
  {
    id: 'mock-4',
    make: 'Jeep',
    model: 'Compass Limited',
    year: 2024,
    price: 189900,
    mileage: 12300,
    color: 'Cinza',
    transmission: 'AUTOMATIC',
    fuelType: 'DIESEL',
    status: 'ACTIVE',
    photos: [],
  },
])

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
  <div>
    <section
      class="relative isolate overflow-hidden bg-primary-900"
      :style="{
        backgroundImage: `linear-gradient(135deg, rgba(43,7,7,0.85) 0%, rgba(139,26,26,0.7) 100%), url('/hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
    >
      <UContainer class="py-20 sm:py-28 lg:py-32">
        <div class="mx-auto max-w-3xl text-center">
          <UBadge
            color="neutral"
            variant="solid"
            label="Estoque selecionado"
            class="mb-5 bg-white/15 text-white ring-1 ring-white/30 backdrop-blur"
          />
          <h1 class="text-4xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
            Encontre o carro
            <span class="text-primary-200">perfeito</span>
            para você
          </h1>
          <p class="mt-5 text-base text-white/90 sm:text-lg">
            Veículos seminovos com procedência garantida.
          </p>

          <UForm
            :state="{ searchQuery }"
            class="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-2 rounded-xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur sm:flex-row"
            @submit="onSearch"
          >
            <UFormField name="searchQuery" class="flex-1">
              <UInput
                v-model="searchQuery"
                icon="i-lucide-search"
                size="xl"
                placeholder="Marca, modelo ou ano..."
                class="w-full"
                color="neutral"
                variant="outline"
                :ui="{ base: 'bg-white text-neutral-900 placeholder:text-neutral-500' }"
              />
            </UFormField>
            <UButton
              type="submit"
              color="primary"
              size="xl"
              icon="i-lucide-search"
              label="Buscar"
            />
          </UForm>
        </div>
      </UContainer>
    </section>

    <UContainer as="section" class="py-14 sm:py-20">
      <div class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Anúncios em destaque
          </h2>
          <p class="mt-1 text-sm text-neutral-600 sm:text-base">
            Confira os veículos disponíveis no nosso estoque.
          </p>
        </div>
        <UButton
          to="/veiculos"
          color="primary"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
          label="Ver todos"
        />
      </div>

      <div
        v-if="filteredVehicles.length > 0"
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <VehicleCard
          v-for="vehicle in filteredVehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
        />
      </div>

      <UCard
        v-else
        :ui="{ root: 'border-2 border-dashed border-neutral-300 bg-neutral-50' }"
      >
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-100 p-4">
            <UIcon name="i-lucide-car-front" class="size-10 text-primary-600" />
          </div>
          <p class="mt-5 text-lg font-semibold text-neutral-900">
            Nenhum anúncio disponível
          </p>
          <p class="mt-1 text-sm text-neutral-600">
            Em breve novos veículos no estoque.
          </p>
        </div>
      </UCard>
    </UContainer>

    <section class="bg-neutral-50 py-14 sm:py-20">
      <UContainer>
        <div class="grid gap-6 sm:grid-cols-3">
          <div class="flex flex-col items-start gap-3">
            <div class="rounded-lg bg-primary-100 p-3">
              <UIcon name="i-lucide-shield-check" class="size-6 text-primary-600" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900">Procedência garantida</h3>
            <p class="text-sm text-neutral-600">
              Todos os veículos passam por inspeção rigorosa antes de entrarem no estoque.
            </p>
          </div>
          <div class="flex flex-col items-start gap-3">
            <div class="rounded-lg bg-primary-100 p-3">
              <UIcon name="i-lucide-handshake" class="size-6 text-primary-600" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900">Negociação transparente</h3>
            <p class="text-sm text-neutral-600">
              Preço justo, histórico claro e atendimento sem enrolação.
            </p>
          </div>
          <div class="flex flex-col items-start gap-3">
            <div class="rounded-lg bg-primary-100 p-3">
              <UIcon name="i-lucide-message-circle" class="size-6 text-primary-600" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900">Atendimento direto</h3>
            <p class="text-sm text-neutral-600">
              Fale com o vendedor pelo WhatsApp e agende a visita quando quiser.
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <section class="bg-primary-600 py-14 sm:py-16">
      <UContainer class="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div>
          <h2 class="text-2xl font-bold text-white sm:text-3xl">
            Pronto para encontrar seu próximo carro?
          </h2>
          <p class="mt-2 text-white/90">
            Fale com a gente pelo WhatsApp e tire suas dúvidas agora.
          </p>
        </div>
        <UButton
          to="/contato"
          color="neutral"
          size="xl"
          icon="i-lucide-message-circle"
          label="Falar no WhatsApp"
          :ui="{ base: 'bg-white text-primary-700 hover:bg-neutral-100' }"
        />
      </UContainer>
    </section>
  </div>
</template>
