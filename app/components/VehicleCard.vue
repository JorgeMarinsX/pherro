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
        root: 'relative isolate aspect-4/5 overflow-hidden border-0 ring-0 bg-neutral-100 bg-cover bg-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
        body: 'flex h-full flex-col p-4',
      }"
      :style="cover ? { backgroundImage: `url('${cover}')` } : undefined"
    >
      <div
        v-if="!cover"
        class="absolute inset-0 -z-10 flex items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200 text-neutral-400"
      >
        <UIcon name="i-lucide-car" class="size-20" />
      </div>

      <div
        class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-white/90 via-white/60 to-white/0"
        aria-hidden="true"
      />

      <div class="flex items-start justify-between">
        <UBadge
          variant="solid"
          :label="String(vehicle.year)"
          :ui="{ base: 'bg-neutral-900 text-white ring-0' }"
        />
      </div>

      <div class="mt-auto space-y-3">
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
