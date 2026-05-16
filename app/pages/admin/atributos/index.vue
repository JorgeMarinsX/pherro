<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Atributos — Pherro Admin' })

// TODO: useFetch('/api/admin/attributes').
const rows = ref<Array<Record<string, unknown>>>([])

const columns = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'type', header: 'Tipo' },
  { accessorKey: 'options', header: 'Opções' },
  { accessorKey: 'actions', header: '' },
]
</script>

<template>
  <UDashboardPanel id="admin-atributos">
    <template #header>
      <UDashboardNavbar title="Atributos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="primary" icon="i-lucide-plus" label="Novo atributo" :ui="{ base: 'text-white' }" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard v-if="rows.length === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-sliders-horizontal" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhum atributo cadastrado</p>
          <p class="mt-1 text-sm text-muted">
            Crie atributos como "Ar-condicionado", "Vidros elétricos" para enriquecer os anúncios.
          </p>
          <UButton color="primary" icon="i-lucide-plus" label="Novo atributo" class="mt-5" :ui="{ base: 'text-white' }" />
        </div>
      </UCard>

      <UCard v-else>
        <UTable :data="rows" :columns="columns" />
      </UCard>
    </template>
  </UDashboardPanel>
</template>
