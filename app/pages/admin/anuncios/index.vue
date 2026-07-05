<script setup lang="ts">
import type { Vehicle, VehicleDetail } from '~/types/vehicle'
import { FUEL_LABELS, TRANSMISSION_LABELS } from '~/types/vehicle'
import type { ExportField } from '~/utils/export'

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

const { list, get, fetchAll, update, remove } = useAdminVehicles()
const toast = useToast()

const PAGE_SIZE = 24
const page = ref(1)

// Debounced query the fetch watches — typing settles 350ms before a request.
// Admin defaults status=ALL (sees inactive too), unlike storefront (ACTIVE only).
// Backend enum is upper-case ALL|ACTIVE|INACTIVE; map the 'all' sentinel up.
function buildQuery(): Record<string, unknown> {
  const q: Record<string, unknown> = {
    status: statusFilter.value === 'all' ? 'ALL' : statusFilter.value,
    take: PAGE_SIZE,
    skip: (page.value - 1) * PAGE_SIZE,
  }
  if (search.value.trim()) q.q = search.value.trim()
  return q
}

const query = ref<Record<string, unknown>>(buildQuery())

// Filter change → reset to page 1, debounced. Page change → commit immediately.
let timer: ReturnType<typeof setTimeout> | undefined
watch([search, statusFilter], () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    query.value = buildQuery()
  }, 350)
})
watch(page, () => { query.value = buildQuery() })

const { data, pending, refresh } = list(query)

const rows = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)

const columns = [
  { accessorKey: 'photo', header: '' },
  { accessorKey: 'vehicle', header: 'Veículo' },
  { accessorKey: 'year', header: 'Ano' },
  { accessorKey: 'price', header: 'Preço' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '' },
]

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const km = new Intl.NumberFormat('pt-BR')

// --- Export ---
const exportOpen = ref(false)

// Filters (minus pagination) so the export matches the current view.
function exportFilters(): Record<string, unknown> {
  const q: Record<string, unknown> = {
    status: statusFilter.value === 'all' ? 'ALL' : statusFilter.value,
  }
  if (search.value.trim()) q.q = search.value.trim()
  return q
}

const statusLabel = (s: string) => (s === 'ACTIVE' ? 'Ativo' : 'Inativo')

// Exportable columns (user picks a subset in ExportModal). pt-BR headers/values.
const exportFields: ExportField<Vehicle>[] = [
  { key: 'make', label: 'Marca' },
  { key: 'model', label: 'Modelo' },
  { key: 'year', label: 'Ano' },
  { key: 'price', label: 'Preço', format: (v) => brl.format(v.price) },
  { key: 'mileage', label: 'KM', format: (v) => km.format(v.mileage) },
  { key: 'color', label: 'Cor' },
  { key: 'transmission', label: 'Câmbio', format: (v) => TRANSMISSION_LABELS[v.transmission] },
  { key: 'fuelType', label: 'Combustível', format: (v) => FUEL_LABELS[v.fuelType] },
  { key: 'status', label: 'Status', format: (v) => statusLabel(v.status) },
]

// --- Create / edit modal ---
const formOpen = ref(false)
const editing = ref<VehicleDetail | null>(null)
const editLoadingId = ref<string | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

// List rows are the slim shape (no description/attributes). Fetch the full
// detail before opening so the edit form prefills every field.
async function openEdit(v: Vehicle) {
  if (editLoadingId.value) return
  editLoadingId.value = v.id
  try {
    editing.value = await get(v.id)
    formOpen.value = true
  } catch {
    toast.add({ title: 'Não foi possível carregar o anúncio.', color: 'error' })
  } finally {
    editLoadingId.value = null
  }
}

// --- Quick status toggle (no modal) ---
const togglingId = ref<string | null>(null)

async function toggleStatus(v: Vehicle) {
  if (togglingId.value) return
  const next = v.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  togglingId.value = v.id
  try {
    await update(v.id, { status: next })
    toast.add({
      title: next === 'ACTIVE' ? 'Anúncio ativado' : 'Anúncio desativado',
      color: 'success',
    })
    await refresh()
  } catch {
    toast.add({ title: 'Não foi possível alterar o status.', color: 'error' })
  } finally {
    togglingId.value = null
  }
}

// --- Delete confirm ---
const deleteOpen = ref(false)
const deleting = ref<Vehicle | null>(null)
const removing = ref(false)

function askDelete(v: Vehicle) {
  deleting.value = v
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleting.value) return
  removing.value = true
  try {
    await remove(deleting.value.id)
    toast.add({ title: 'Anúncio excluído', color: 'success' })
    deleteOpen.value = false
    deleting.value = null
    await refresh()
  } catch {
    toast.add({ title: 'Não foi possível excluir o anúncio.', color: 'error' })
  } finally {
    removing.value = false
  }
}
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
            color="neutral"
            variant="soft"
            icon="i-lucide-download"
            label="Exportar"
            :disabled="total === 0"
            @click="exportOpen = true"
          />
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Novo anúncio"
            :ui="{ base: 'text-white' }"
            @click="openCreate"
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
      <UCard v-if="!pending && total === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-car-front" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhum anúncio cadastrado</p>
          <p class="mt-1 text-sm text-muted">Crie o primeiro anúncio para começar.</p>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Novo anúncio"
            class="mt-5"
            :ui="{ base: 'text-white' }"
            @click="openCreate"
          />
        </div>
      </UCard>

      <UCard v-else-if="pending && rows.length === 0">
        <div class="space-y-3">
          <div v-for="i in 8" :key="i" class="flex items-center gap-4">
            <USkeleton class="size-12 rounded-md" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-48" />
              <USkeleton class="h-3 w-24" />
            </div>
            <USkeleton class="h-4 w-12" />
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-6 w-16 rounded-full" />
          </div>
        </div>
      </UCard>

      <UCard v-else>
        <UTable :data="rows" :columns="columns" :loading="pending" empty="Nenhum anúncio encontrado">
          <template #photo-cell="{ row }">
            <img
              v-if="row.original.photos?.[0]?.url"
              :src="row.original.photos[0].thumbUrl ?? row.original.photos[0].url"
              :alt="`${row.original.make} ${row.original.model}`"
              class="size-12 rounded-md object-cover"
            >
            <div v-else class="flex size-12 items-center justify-center rounded-md bg-elevated">
              <UIcon name="i-lucide-car-front" class="size-5 text-muted" />
            </div>
          </template>

          <template #vehicle-cell="{ row }">
            <div class="font-medium text-highlighted">{{ row.original.make }} {{ row.original.model }}</div>
            <div class="text-xs text-muted">{{ row.original.color }}</div>
          </template>

          <template #year-cell="{ row }">
            {{ row.original.year }}
          </template>

          <template #price-cell="{ row }">
            {{ brl.format(row.original.price) }}
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :color="row.original.status === 'ACTIVE' ? 'success' : 'neutral'"
              variant="subtle"
              :label="row.original.status === 'ACTIVE' ? 'Ativo' : 'Inativo'"
            />
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center justify-end gap-1">
              <USwitch
                :model-value="row.original.status === 'ACTIVE'"
                color="success"
                :loading="togglingId === row.original.id"
                :disabled="Boolean(togglingId)"
                :aria-label="row.original.status === 'ACTIVE' ? 'Desativar' : 'Ativar'"
                class="mr-1"
                @update:model-value="toggleStatus(row.original)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                aria-label="Editar"
                :loading="editLoadingId === row.original.id"
                :disabled="Boolean(editLoadingId)"
                @click="openEdit(row.original)"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                aria-label="Excluir"
                @click="askDelete(row.original)"
              />
            </div>
          </template>
        </UTable>

        <div v-if="total > PAGE_SIZE" class="flex items-center justify-between border-t border-default pt-4">
          <p class="text-sm text-muted">{{ total }} anúncio{{ total === 1 ? '' : 's' }}</p>
          <UPagination
            v-model:page="page"
            :total="total"
            :items-per-page="PAGE_SIZE"
          />
        </div>
      </UCard>

      <AnuncioFormModal v-model:open="formOpen" :vehicle="editing" @submitted="refresh" />

      <ExportModal
        v-model:open="exportOpen"
        title="Anúncios"
        filename-base="anuncios"
        :fields="exportFields"
        :fetch-all="() => fetchAll(exportFilters())"
      />

      <UModal v-model:open="deleteOpen" title="Excluir anúncio">
        <template #body>
          <p class="text-sm text-muted">
            Excluir este anúncio? Esta ação não pode ser desfeita.
          </p>
          <div class="flex items-center justify-end gap-2 pt-4">
            <UButton color="neutral" variant="ghost" label="Cancelar" :disabled="removing" @click="deleteOpen = false" />
            <UButton color="error" icon="i-lucide-trash-2" label="Excluir" :loading="removing" @click="confirmDelete" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
