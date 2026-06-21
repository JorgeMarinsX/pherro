<script setup lang="ts">
import type { AttributeDefinition } from '~/types/attribute'
import { ATTRIBUTE_TYPE_LABELS } from '~/types/attribute'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Atributos — Pherro Admin' })

const { list, remove } = useAdminAttributes()
const store = useAttributesStore()
const toast = useToast()

const { data: rows, refresh } = list()

const formOpen = ref(false)
// null = create mode; set = edit that attribute.
const editing = ref<AttributeDefinition | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(a: AttributeDefinition) {
  editing.value = a
  formOpen.value = true
}

async function onRemove(a: AttributeDefinition) {
  try {
    await remove(a.id)
    toast.add({ title: 'Atributo removido', color: 'success' })
    await onChanged()
  } catch (err: unknown) {
    toast.add({
      title: 'Erro ao remover',
      description: String((err as { data?: { message?: string } }).data?.message ?? ''),
      color: 'error',
    })
  }
}

// Keep table + store in sync after any mutation.
async function onChanged() {
  await refresh()
  await store.fetchDefinitions()
}

const columns = [
  { accessorKey: 'icon', header: 'Ícone' },
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'type', header: 'Tipo' },
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
          <UButton color="primary" icon="i-lucide-plus" label="Novo atributo" :ui="{ base: 'text-white' }" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard v-if="!rows || rows.length === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-sliders-horizontal" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhum atributo cadastrado</p>
          <p class="mt-1 text-sm text-muted">
            Crie atributos como "Ar-condicionado", "Vidros elétricos" para enriquecer os anúncios.
          </p>
          <UButton color="primary" icon="i-lucide-plus" label="Novo atributo" class="mt-5" :ui="{ base: 'text-white' }" @click="openCreate" />
        </div>
      </UCard>

      <UCard v-else>
        <UTable :data="rows" :columns="columns">
          <template #icon-cell="{ row }">
            <UIcon :name="row.original.icon || 'i-lucide-tag'" class="size-5 text-muted" />
          </template>
          <template #type-cell="{ row }">
            {{ ATTRIBUTE_TYPE_LABELS[row.original.type] }}
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Editar" @click="openEdit(row.original)" />
              <UButton color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Remover" @click="onRemove(row.original)" />
            </div>
          </template>
        </UTable>
      </UCard>

      <AtributoFormModal v-model:open="formOpen" :attribute="editing" @submitted="onChanged" />
    </template>
  </UDashboardPanel>
</template>
