<script setup lang="ts">
import type { Vehicle } from '~/types/vehicle'
import { TRANSMISSION_LABELS, FUEL_LABELS } from '~/types/vehicle'

const props = defineProps<{ vehicle: Vehicle }>()

const formattedPrice = computed(() =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(props.vehicle.price)),
)

const formattedMileage = computed(() =>
  new Intl.NumberFormat('pt-BR').format(props.vehicle.mileage),
)

const cover = computed(() =>
  [...(props.vehicle.photos ?? [])].sort((a, b) => a.position - b.position)[0]?.url,
)
</script>

<template>
  <NuxtLink
    :to="`/veiculos/${vehicle.id}`"
    class="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-[#8B1A1A] hover:shadow-lg"
  >
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
      <img
        v-if="cover"
        :src="cover"
        :alt="`${vehicle.make} ${vehicle.model}`"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <div v-else class="flex h-full w-full items-center justify-center text-neutral-400">
        <UIcon name="i-lucide-car" class="size-12" />
      </div>
      <UBadge
        color="primary"
        variant="solid"
        class="absolute left-3 top-3"
      >
        {{ vehicle.year }}
      </UBadge>
    </div>

    <div class="space-y-3 p-4">
      <div>
        <h3 class="line-clamp-1 text-base font-semibold text-black">
          {{ vehicle.make }} {{ vehicle.model }}
        </h3>
        <p class="text-lg font-bold text-[#8B1A1A]">
          {{ formattedPrice }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2 text-xs text-neutral-600">
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-gauge" class="size-3.5" />
          {{ formattedMileage }} km
        </span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-settings-2" class="size-3.5" />
          {{ TRANSMISSION_LABELS[vehicle.transmission] }}
        </span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-fuel" class="size-3.5" />
          {{ FUEL_LABELS[vehicle.fuelType] }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
