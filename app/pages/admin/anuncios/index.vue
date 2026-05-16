<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Anúncios — Pherro Admin' })

const search = ref('')
const statusFilter = ref<'all' | 'ACTIVE' | 'INACTIVE'>('all')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'ACTIVE' },
  { label: 'Inativos', value: 'INACTIVE' },
]

// TODO: replace with useFetch('/api/admin/vehicles', { query: { search, status } }).
const rows = ref<Array<Record<string, unknown>>>([])

const columns = [
  { accessorKey: 'photo', header: '' },
  { accessorKey: 'vehicle', header: 'Veículo' },
  { accessorKey: 'year', header: 'Ano' },
  { accessorKey: 'price', header: 'Preço' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '' },
]
</script>

<template>
  <UDashboardPanel id="admin-anuncios">
    <template #header>
      <UDashboardNavbar title="Anúncios">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            to="/admin/anuncios/novo"
            color="primary"
            icon="i-lucide-plus"
            label="Novo anúncio"
            :ui="{ base: 'text-white' }"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Buscar por marca, modelo..."
            class="w-72"
          />
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            class="w-40"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UCard v-if="rows.length === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-car-front" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhum anúncio cadastrado</p>
          <p class="mt-1 text-sm text-muted">Crie o primeiro anúncio para começar.</p>
          <UButton
            to="/admin/anuncios/novo"
            color="primary"
            icon="i-lucide-plus"
            label="Novo anúncio"
            class="mt-5"
            :ui="{ base: 'text-white' }"
          />
        </div>
      </UCard>

      <UCard v-else>
        <UTable :data="rows" :columns="columns" />
      </UCard>
    </template>
  </UDashboardPanel>
</template>
