<script setup lang="ts">
import type { Lead } from '~/types/lead'
import { LEAD_SOURCE_LABELS } from '~/types/lead'
import type { ExportField } from '~/utils/export'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Leads — Pherro Admin' })

const search = ref('')
const sourceFilter = ref<'all' | 'MANUAL' | 'FORM'>('all')

const formOpen = ref(false)
const exportOpen = ref(false)

const sourceOptions = [
  { label: 'Todas origens', value: 'all' },
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Formulário', value: 'FORM' },
]

const { list, fetchAll } = useAdminLeads()

const PAGE_SIZE = 50
const page = ref(1)

// Backend leads filter: `source` enum (MANUAL|FORM) + `search` (name/email).
function buildQuery(): Record<string, unknown> {
  const q: Record<string, unknown> = {
    take: PAGE_SIZE,
    skip: (page.value - 1) * PAGE_SIZE,
  }
  if (sourceFilter.value !== 'all') q.source = sourceFilter.value
  if (search.value.trim()) q.search = search.value.trim()
  return q
}

const query = ref<Record<string, unknown>>(buildQuery())

let timer: ReturnType<typeof setTimeout> | undefined
watch([search, sourceFilter], () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    query.value = buildQuery()
  }, 350)
})
watch(page, () => { query.value = buildQuery() })

const { data, pending } = list(query)

const rows = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)

// Filters (minus pagination) reused so the export matches the current view.
function exportFilters(): Record<string, unknown> {
  const q: Record<string, unknown> = {}
  if (sourceFilter.value !== 'all') q.source = sourceFilter.value
  if (search.value.trim()) q.search = search.value.trim()
  return q
}

const dt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
function fmtDate(v?: string): string {
  return v ? dt.format(new Date(v)) : ''
}

const columns = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'phone', header: 'Telefone' },
  { accessorKey: 'email', header: 'E-mail' },
  { accessorKey: 'source', header: 'Origem' },
  { accessorKey: 'interests', header: 'Interesses' },
  { accessorKey: 'createdAt', header: 'Criado em' },
]

// Exportable columns (user picks a subset in ExportModal). pt-BR headers.
const exportFields: ExportField<Lead>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'email', label: 'E-mail', format: (l) => l.email ?? '' },
  { key: 'source', label: 'Origem', format: (l) => LEAD_SOURCE_LABELS[l.source] },
  { key: 'interests', label: 'Interesses', format: (l) => String(l.vehicleInterests?.length ?? 0) },
  { key: 'notes', label: 'Observações', format: (l) => l.notes ?? '' },
  { key: 'createdAt', label: 'Criado em', format: (l) => fmtDate(l.createdAt) },
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
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-download"
            label="Exportar"
            :disabled="total === 0"
            @click="exportOpen = true"
          />
          <UButton color="primary" icon="i-lucide-plus" label="Novo lead" :ui="{ base: 'text-white' }" @click="formOpen = true" />
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
      <UCard v-if="!pending && total === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
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

      <UCard v-else-if="pending && rows.length === 0">
        <div class="space-y-3">
          <div v-for="i in 8" :key="i" class="flex items-center gap-4">
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-48" />
              <USkeleton class="h-3 w-24" />
            </div>
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-6 w-16 rounded-full" />
          </div>
        </div>
      </UCard>

      <UCard v-else>
        <UTable :data="rows" :columns="columns" :loading="pending" empty="Nenhum lead encontrado">
          <template #email-cell="{ row }">
            {{ row.original.email || '—' }}
          </template>

          <template #source-cell="{ row }">
            <UBadge
              :color="row.original.source === 'FORM' ? 'primary' : 'neutral'"
              variant="subtle"
              :label="row.original.source === 'FORM' ? 'Formulário' : 'Manual'"
            />
          </template>

          <template #interests-cell="{ row }">
            {{ row.original.vehicleInterests?.length ?? 0 }}
          </template>

          <template #createdAt-cell="{ row }">
            {{ fmtDate(row.original.createdAt) }}
          </template>
        </UTable>

        <div v-if="total > PAGE_SIZE" class="flex items-center justify-between border-t border-default pt-4">
          <p class="text-sm text-muted">{{ total }} lead{{ total === 1 ? '' : 's' }}</p>
          <UPagination
            v-model:page="page"
            :total="total"
            :items-per-page="PAGE_SIZE"
          />
        </div>
      </UCard>

      <LeadFormModal v-model:open="formOpen" />

      <ExportModal
        v-model:open="exportOpen"
        title="Leads"
        filename-base="leads"
        :fields="exportFields"
        :fetch-all="() => fetchAll(exportFilters())"
      />
    </template>
  </UDashboardPanel>
</template>
