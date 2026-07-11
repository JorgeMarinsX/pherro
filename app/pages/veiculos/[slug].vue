<script setup lang="ts">
import type { VehicleDetail } from '~/types/vehicle'
import { TRANSMISSION_LABELS, FUEL_LABELS } from '~/types/vehicle'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: vehicle, error } = await useFetch<VehicleDetail>(
  () => `/api/vehicles/${slug.value}`,
  {
    key: () => `vehicle-by-slug-${slug.value}`,
    server: true,
  },
)

if (error.value || !vehicle.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Veículo não encontrado',
  })
}

const v = vehicle.value

useSeoMeta({
  title: () => `${v.make} ${v.model} ${v.year} — Pherro`,
  description: () =>
    v.description ?? `${v.make} ${v.model} ${v.year} — ${v.color}, ${v.mileage} km.`,
})

const formattedPrice = computed(() =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v.price),
)

const formattedMileage = computed(() =>
  new Intl.NumberFormat('pt-BR').format(v.mileage),
)

const sortedPhotos = computed(() =>
  [...(v.photos ?? [])].sort((a, b) => a.position - b.position),
)

const activePhotoIdx = ref(0)
const activePhoto = computed(() => sortedPhotos.value[activePhotoIdx.value])

// Storefront CTAs always use the single ACTIVE number (per-vehicle FK ignored).
const { urlFor } = useWhatsapp()
const whatsappHref = computed(() =>
  urlFor(`Olá! Tenho interesse no ${v.make} ${v.model} ${v.year}.`),
)

// Lead-capture gate: quick form before the WhatsApp CTA reveals. Once a
// visitor passes it, skip the form on later clicks (per-origin = per-tenant).
const LEAD_GATE_KEY = 'pherro:lead-captured'
const gateOpen = ref(false)

function onWhatsappClick() {
  if (!whatsappHref.value) return
  let captured = false
  try {
    captured = Boolean(localStorage.getItem(LEAD_GATE_KEY))
  } catch { /* storage blocked → always gate */ }
  if (captured) {
    window.open(whatsappHref.value, '_blank', 'noopener')
  } else {
    gateOpen.value = true
  }
}

function onLeadCaptured() {
  try {
    localStorage.setItem(LEAD_GATE_KEY, new Date().toISOString())
  } catch { /* non-fatal */ }
}
</script>

<template>
  <UContainer as="section" class="py-10 sm:py-14">
    <UBreadcrumb
      :items="[
        { label: 'Início', to: '/' },
        { label: 'Veículos', to: '/veiculos' },
        { label: `${v.make} ${v.model}` },
      ]"
      class="mb-6"
    />

    <div class="grid gap-8 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <div class="overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200">
          <div
            v-if="activePhoto"
            class="aspect-4/3 w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${activePhoto.url}')` }"
            role="img"
            :aria-label="`${v.make} ${v.model}`"
          />
          <div
            v-else
            class="flex aspect-4/3 w-full items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200 text-neutral-400"
          >
            <UIcon name="i-lucide-car" class="size-24" />
          </div>
        </div>

        <div
          v-if="sortedPhotos.length > 1"
          class="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6"
        >
          <button
            v-for="(photo, idx) in sortedPhotos"
            :key="photo.id"
            type="button"
            class="aspect-square overflow-hidden rounded-md bg-neutral-100 ring-1 transition"
            :class="
              idx === activePhotoIdx
                ? 'ring-2 ring-primary-600'
                : 'ring-neutral-200 hover:ring-neutral-400'
            "
            :style="{ backgroundImage: `url('${photo.thumbUrl ?? photo.url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }"
            :aria-label="`Foto ${Number(idx) + 1}`"
            @click="activePhotoIdx = idx"
          />
        </div>
      </div>

      <div class="lg:col-span-2">
        <UBadge
          variant="solid"
          :label="String(v.year)"
          :ui="{ base: 'bg-neutral-900 text-white ring-0' }"
        />
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          {{ v.make }} {{ v.model }}
        </h1>
        <p class="mt-2 text-3xl font-extrabold text-primary-600 sm:text-4xl">
          {{ formattedPrice }}
        </p>

        <div class="mt-6 flex flex-wrap gap-2">
          <UBadge
            color="neutral"
            variant="subtle"
            :label="`${formattedMileage} km`"
            icon="i-lucide-gauge"
          />
          <UBadge
            color="neutral"
            variant="subtle"
            :label="TRANSMISSION_LABELS[v.transmission]"
            icon="i-lucide-settings-2"
          />
          <UBadge
            color="neutral"
            variant="subtle"
            :label="FUEL_LABELS[v.fuelType]"
            icon="i-lucide-fuel"
          />
          <UBadge
            color="neutral"
            variant="subtle"
            :label="v.color"
            icon="i-lucide-palette"
          />
        </div>

        <div class="mt-8 rounded-xl bg-slate-100 p-5 ring-1 ring-slate-200">
          <h2 class="font-semibold text-neutral-900">Descrição</h2>
          <p
            v-if="v.description"
            class="mt-3 whitespace-pre-line text-sm text-neutral-700"
          >
            {{ v.description }}
          </p>
          <VehicleSpecsTable :vehicle="v" class="mt-4" />
        </div>

        <UButton
          v-if="whatsappHref"
          size="xl"
          icon="i-simple-icons-whatsapp"
          label="Falar no WhatsApp"
          block
          class="mt-8 bg-neutral-900 text-white hover:bg-neutral-800"
          @click="onWhatsappClick"
        />
        <UButton
          v-else
          to="/contato"
          color="primary"
          size="xl"
          icon="i-lucide-message-circle"
          label="Entrar em contato"
          block
          class="mt-8"
        />

      </div>
    </div>

    <LeadCaptureModal
      v-if="whatsappHref"
      v-model:open="gateOpen"
      :vehicle-id="v.id"
      :vehicle-label="`${v.make} ${v.model} ${v.year}`"
      :whatsapp-href="whatsappHref"
      @captured="onLeadCaptured"
    />
  </UContainer>
</template>
