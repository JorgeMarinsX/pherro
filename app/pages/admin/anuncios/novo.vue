<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Novo anúncio — Pherro Admin' })

// TODO: wire form state + submit to POST /api/admin/vehicles.
const state = reactive({
  make: '',
  model: '',
  year: undefined as number | undefined,
  price: undefined as number | undefined,
  mileage: undefined as number | undefined,
  color: '',
  transmission: 'MANUAL',
  fuelType: 'FLEX',
  status: 'ACTIVE',
  description: '',
})

const transmissionOptions = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Automático', value: 'AUTOMATIC' },
  { label: 'CVT', value: 'CVT' },
]

const fuelOptions = [
  { label: 'Flex', value: 'FLEX' },
  { label: 'Gasolina', value: 'GASOLINE' },
  { label: 'Etanol', value: 'ETHANOL' },
  { label: 'Diesel', value: 'DIESEL' },
  { label: 'Elétrico', value: 'ELECTRIC' },
]

const statusOptions = [
  { label: 'Ativo', value: 'ACTIVE' },
  { label: 'Inativo', value: 'INACTIVE' },
]

function onSubmit() {
  // TODO: POST /api/admin/vehicles, then navigateTo(`/admin/anuncios/${id}`).
}
</script>

<template>
  <UDashboardPanel id="admin-anuncios-novo">
    <template #header>
      <UDashboardNavbar title="Novo anúncio">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            to="/admin/anuncios"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            label="Voltar"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard class="mx-auto max-w-3xl">
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
            <UButton to="/admin/anuncios" color="neutral" variant="ghost" label="Cancelar" />
            <UButton type="submit" color="primary" icon="i-lucide-save" label="Salvar anúncio" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
