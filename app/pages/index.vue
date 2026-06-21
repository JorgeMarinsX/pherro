<script setup lang="ts">
import type { Vehicle } from '~/types/vehicle'

useSeoMeta({
  title: 'Pherro — Veículos Seminovos',
  description: 'Encontre o carro ideal. Estoque selecionado de veículos seminovos com procedência garantida.',
})

const config = useRuntimeConfig()
const baseUrl = import.meta.server ? config.backendUrl : config.public.backendUrl

const { data: list } = await useFetch<{
  items: Vehicle[]
  total: number
  take: number
  skip: number
}>(`${baseUrl}/vehicles`, {
  key: 'home-vehicles',
  query: { status: 'ACTIVE', take: 8 },
  default: () => ({ items: [], total: 0, take: 0, skip: 0 }),
})

const vehicles = computed<Vehicle[]>(() => list.value?.items ?? [])

// Storefront WhatsApp CTAs route through the single ACTIVE number.
const { urlFor } = useWhatsapp()
const whatsappCtaHref = computed(
  () => urlFor('Olá! Gostaria de saber mais sobre os veículos.') ?? '/contato',
)

// Live search + submit/handoff — shared with the listing page's backend query.
const { query: searchQuery, results, searching, open, submit, goToVehicle } = useVehicleSearch()

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(price)
</script>

<template>
  <div>
    <section
      class="relative isolate z-10 bg-primary-900"
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

          <div class="relative mx-auto mt-10 w-full max-w-2xl">
            <UForm
              :state="{ searchQuery }"
              class="flex w-full flex-col gap-2 rounded-xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur sm:flex-row"
              @submit="submit"
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
                  @focus="open = results.length > 0"
                  @blur="() => setTimeout(() => (open = false), 150)"
                />
              </UFormField>
              <UButton
                type="submit"
                class="bg-neutral-900 text-white hover:bg-neutral-800"
                size="xl"
                icon="i-lucide-search"
                label="Buscar"
              />
            </UForm>

            <!-- Live results dropdown -->
            <div
              v-if="open"
              class="absolute inset-x-2 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white text-left shadow-xl ring-1 ring-neutral-200"
            >
              <div v-if="searching" class="flex items-center gap-2 px-4 py-3 text-sm text-neutral-500">
                <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
                Buscando...
              </div>

              <ul v-else-if="results.length" class="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
                <li v-for="vehicle in results" :key="vehicle.id">
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
                    @mousedown.prevent="goToVehicle(vehicle.slug)"
                  >
                    <div
                      class="size-12 shrink-0 rounded-md bg-neutral-100 bg-cover bg-center ring-1 ring-neutral-200"
                      :style="vehicle.photos?.[0]?.url ? { backgroundImage: `url('${vehicle.photos[0].url}')` } : undefined"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-semibold text-neutral-900">
                        {{ vehicle.make }} {{ vehicle.model }}
                        <span class="font-normal text-neutral-500">{{ vehicle.year }}</span>
                      </p>
                      <p class="text-sm font-bold text-primary-600">{{ formatPrice(vehicle.price) }}</p>
                    </div>
                    <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-neutral-400" />
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    class="flex w-full items-center justify-center gap-2 bg-neutral-50 px-4 py-3 text-sm font-medium text-primary-600 transition hover:bg-neutral-100"
                    @mousedown.prevent="submit"
                  >
                    Ver todos os resultados
                    <UIcon name="i-lucide-arrow-right" class="size-4" />
                  </button>
                </li>
              </ul>

              <div v-else class="px-4 py-3 text-sm text-neutral-500">
                Nenhum veículo encontrado.
              </div>
            </div>
          </div>
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
        v-if="vehicles.length > 0"
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <VehicleCard
          v-for="vehicle in vehicles"
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
          :to="whatsappCtaHref"
          :target="whatsappCtaHref.startsWith('http') ? '_blank' : undefined"
          :rel="whatsappCtaHref.startsWith('http') ? 'noopener' : undefined"
          color="neutral"
          size="xl"
          icon="i-simple-icons-whatsapp"
          label="Falar no WhatsApp"
          :ui="{ base: 'bg-white text-primary-700 hover:bg-neutral-100' }"
        />
      </UContainer>
    </section>
  </div>
</template>
