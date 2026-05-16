<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Leads — Pherro Admin' })

const search = ref('')
const sourceFilter = ref<'all' | 'MANUAL' | 'FORM'>('all')

const sourceOptions = [
  { label: 'Todas origens', value: 'all' },
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Formulário', value: 'FORM' },
]

// TODO: useFetch('/api/admin/leads', { query: { search, source } }).
const rows = ref<Array<Record<string, unknown>>>([])

const columns = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'phone', header: 'Telefone' },
  { accessorKey: 'email', header: 'E-mail' },
  { accessorKey: 'source', header: 'Origem' },
  { accessorKey: 'interests', header: 'Interesses' },
  { accessorKey: 'createdAt', header: 'Criado em' },
]
</script>

<template>
  <UDashboardPanel id="admin-leads">
    <template #header>
      <UDashboardNavbar title="Leads">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="primary" icon="i-lucide-plus" label="Novo lead" :ui="{ base: 'text-white' }" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="search" icon="i-lucide-search" placeholder="Buscar lead..." class="w-72" />
          <USelect v-model="sourceFilter" :items="sourceOptions" value-key="value" class="w-44" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UCard v-if="rows.length === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-users" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhum lead registrado</p>
          <p class="mt-1 text-sm text-muted">
            Os leads aparecerão aqui assim que prospects preencherem o formulário.
          </p>
        </div>
      </UCard>

      <UCard v-else>
        <UTable :data="rows" :columns="columns" />
      </UCard>
    </template>
  </UDashboardPanel>
</template>
