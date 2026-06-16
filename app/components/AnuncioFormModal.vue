<script setup lang="ts">
import type { Vehicle, VehicleFormState } from '~/types/vehicle'
import { FUEL_LABELS, TRANSMISSION_LABELS } from '~/types/vehicle'

const open = defineModel<boolean>('open', { default: false })

// Present = edit mode (prefill + "Editar anúncio"). Absent = create mode (blank + "Novo anúncio").
const props = defineProps<{ vehicle?: Vehicle | null }>()

const emit = defineEmits<{ submitted: [] }>()

const isEdit = computed(() => Boolean(props.vehicle?.id))
const title = computed(() => (isEdit.value ? 'Editar anúncio' : 'Novo anúncio'))

function blankState(): VehicleFormState {
  return {
    make: '',
    model: '',
    year: undefined,
    price: undefined,
    mileage: undefined,
    color: '',
    transmission: 'MANUAL',
    fuelType: 'FLEX',
    status: 'ACTIVE',
    description: '',
  }
}

function fromVehicle(v: Vehicle): VehicleFormState {
  return {
    make: v.make,
    model: v.model,
    year: v.year,
    price: v.price,
    mileage: v.mileage,
    color: v.color,
    transmission: v.transmission,
    fuelType: v.fuelType,
    status: v.status,
    description: v.description ?? '',
  }
}

// TODO: wire submit to POST/PATCH /api/admin/vehicles.
const state = reactive<VehicleFormState>(blankState())

// Reset or prefill each time modal opens, based on passed context.
watch(open, (isOpen: boolean) => {
  if (!isOpen) return
  Object.assign(state, props.vehicle ? fromVehicle(props.vehicle) : blankState())
})

const transmissionOptions = Object.entries(TRANSMISSION_LABELS).map(([value, label]) => ({ label, value }))
const fuelOptions = Object.entries(FUEL_LABELS).map(([value, label]) => ({ label, value }))
const statusOptions = [
  { label: 'Ativo', value: 'ACTIVE' },
  { label: 'Inativo', value: 'INACTIVE' },
]

function onSubmit() {
  // TODO: POST (create) or PATCH `/api/admin/vehicles/${props.vehicle?.id}` (edit).
  emit('submitted')
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Marca" name="make" required>
            <UInput v-model="state.make" placeholder="Ex.: Volkswagen" class="w-full" />
          </UFormField>
          <UFormField label="Modelo" name="model" required>
            <UInput v-model="state.model" placeholder="Ex.: Nivus Highline" class="w-full" />
          </UFormField>
          <UFormField label="Ano" name="year" required>
            <UInput v-model="state.year" type="number" placeholder="2024" class="w-full" />
          </UFormField>
          <UFormField label="Cor" name="color">
            <UInput v-model="state.color" placeholder="Branco" class="w-full" />
          </UFormField>
          <UFormField label="Preço (R$)" name="price" required>
            <UInput v-model="state.price" type="number" placeholder="89900" class="w-full" />
          </UFormField>
          <UFormField label="Quilometragem" name="mileage" required>
            <UInput v-model="state.mileage" type="number" placeholder="35000" class="w-full" />
          </UFormField>
          <UFormField label="Câmbio" name="transmission" required>
            <USelect v-model="state.transmission" :items="transmissionOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Combustível" name="fuelType" required>
            <USelect v-model="state.fuelType" :items="fuelOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Status" name="status" required class="sm:col-span-2">
            <USelect v-model="state.status" :items="statusOptions" value-key="value" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Descrição" name="description">
          <UTextarea v-model="state.description" :rows="5" placeholder="Detalhes do veículo..." class="w-full" />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="open = false" />
          <UButton type="submit" color="primary" icon="i-lucide-save" :label="isEdit ? 'Salvar alterações' : 'Salvar anúncio'" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
