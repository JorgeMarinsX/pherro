<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VehicleDetail } from '~/types/vehicle'
import { TRANSMISSION_LABELS, FUEL_LABELS } from '~/types/vehicle'

const props = defineProps<{
  vehicle: VehicleDetail
}>()

interface SpecRow {
  label: string
  value: string
}

const formattedMileage = computed(() =>
  new Intl.NumberFormat('pt-BR').format(props.vehicle.mileage),
)

// Static spec rows + any custom attributes attached to this vehicle.
const rows = computed<SpecRow[]>(() => [
  { label: 'Câmbio', value: TRANSMISSION_LABELS[props.vehicle.transmission] },
  { label: 'Combustível', value: FUEL_LABELS[props.vehicle.fuelType] },
  { label: 'Ano', value: String(props.vehicle.year) },
  { label: 'Quilometragem', value: `${formattedMileage.value} km` },
  { label: 'Cor', value: props.vehicle.color },
  ...(props.vehicle.attributes ?? []).map(a => ({
    label: a.attributeDefinition.name,
    value: a.value,
  })),
])

const columns: TableColumn<SpecRow>[] = [
  { accessorKey: 'label', header: 'Especificação' },
  { accessorKey: 'value', header: 'Detalhe' },
]
</script>

<template>
  <UTable
    :data="rows"
    :columns="columns"
    :ui="{ root: 'bg-transparent', th: 'text-neutral-500', td: 'text-neutral-700' }"
  />
</template>
