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
  <ULink
    :to="`/veiculos/${vehicle.id}`"
    class="group block"
  >
    <UCard
      :ui="{
        root: 'overflow-hidden border-neutral-200 transition hover:-translate-y-0.5 hover:border-primary-600 hover:shadow-xl',
        body: 'p-4',
        header: 'p-0 border-b-0',
      }"
    >
      <template #header>
        <div class="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
          <img
            v-if="cover"
            :src="cover"
            :alt="`${vehicle.make} ${vehicle.model}`"
            class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          >
          <div v-else class="flex h-full w-full items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200 text-neutral-400">
            <UIcon name="i-lucide-car" class="size-16" />
          </div>
          <UBadge
            color="primary"
            variant="solid"
            :label="String(vehicle.year)"
            class="absolute left-3 top-3 shadow-md"
          />
        </div>
      </template>

      <div class="space-y-3">
        <div>
          <h3 class="line-clamp-1 text-base font-semibold text-neutral-900">
            {{ vehicle.make }} {{ vehicle.model }}
          </h3>
          <p class="mt-1 text-xl font-extrabold text-primary-600">
            {{ formattedPrice }}
          </p>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            :label="`${formattedMileage} km`"
            icon="i-lucide-gauge"
          />
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            :label="TRANSMISSION_LABELS[vehicle.transmission]"
            icon="i-lucide-settings-2"
          />
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            :label="FUEL_LABELS[vehicle.fuelType]"
            icon="i-lucide-fuel"
          />
        </div>
      </div>
    </UCard>
  </ULink>
</template>
