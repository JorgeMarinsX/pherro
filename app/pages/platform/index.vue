<script setup lang="ts">
import type { Tenant } from '~/types/tenant'

definePageMeta({
  layout: 'platform',
  middleware: 'platform',
})

useHead({ title: 'Lojas — Pherro Plataforma' })

const { list, update } = usePlatformTenants()
const config = useRuntimeConfig()
const toast = useToast()

const { data: tenants, pending, refresh } = list()

const search = ref('')
const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tenants.value
  return tenants.value.filter(
    t => t.name.toLowerCase().includes(q) || t.slug.includes(q),
  )
})

const columns = [
  { accessorKey: 'name', header: 'Loja' },
  { accessorKey: 'slug', header: 'Site' },
  { accessorKey: 'plan', header: 'Plano' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Criada em' },
  { id: 'actions', header: '' },
]

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

const formOpen = ref(false)
const editing = ref<Tenant | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(tenant: Tenant) {
  editing.value = tenant
  formOpen.value = true
}

async function toggleStatus(tenant: Tenant) {
  const suspend = tenant.status === 'ACTIVE'
  try {
    await update(tenant.id, { status: suspend ? 'SUSPENDED' : 'ACTIVE' })
    toast.add({
      title: suspend ? 'Loja suspensa' : 'Loja reativada',
      description: suspend
        ? `${tenant.name} foi suspensa. Site e login bloqueados.`
        : `${tenant.name} está ativa novamente.`,
      color: suspend ? 'warning' : 'success',
    })
    await refresh()
  } catch {
    toast.add({ title: 'Erro ao alterar status', color: 'error' })
  }
}

function rowActions(tenant: Tenant) {
  return [
    [
      { label: 'Editar', icon: 'i-lucide-pencil', onSelect: () => openEdit(tenant) },
      {
        label: 'Abrir site',
        icon: 'i-lucide-external-link',
        to: `https://${tenant.slug}.${config.public.appBaseDomain}`,
        target: '_blank',
      },
    ],
    [
      tenant.status === 'ACTIVE'
        ? { label: 'Suspender', icon: 'i-lucide-ban', color: 'error' as const, onSelect: () => toggleStatus(tenant) }
        : { label: 'Reativar', icon: 'i-lucide-circle-check', onSelect: () => toggleStatus(tenant) },
    ],
  ]
}

async function onSubmitted() {
  await refresh()
  toast.add({ title: 'Loja salva', color: 'success' })
}
</script>

<template>
  <UDashboardPanel id="platform-tenants">
    <template #header>
      <UDashboardNavbar title="Lojas">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Nova loja"
            :ui="{ base: 'text-white' }"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="search" icon="i-lucide-search" placeholder="Buscar loja..." class="w-72" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UCard v-if="!pending && rows.length === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-store" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhuma loja encontrada</p>
          <p class="mt-1 text-sm text-muted">
            Crie a primeira loja para colocá-la no ar em segundos.
          </p>
          <UButton
            class="mt-6"
            color="primary"
            icon="i-lucide-plus"
            label="Nova loja"
            :ui="{ base: 'text-white' }"
            @click="openCreate"
          />
        </div>
      </UCard>

      <UCard v-else>
        <UTable :data="rows" :columns="columns" :loading="pending">
          <template #name-cell="{ row }">
            <span class="font-medium text-highlighted">{{ row.original.name }}</span>
          </template>

          <template #slug-cell="{ row }">
            <a
              :href="`https://${row.original.slug}.${config.public.appBaseDomain}`"
              target="_blank"
              rel="noopener"
              class="text-sm text-muted hover:text-primary-400"
            >
              {{ row.original.slug }}.{{ config.public.appBaseDomain }}
            </a>
          </template>

          <template #plan-cell="{ row }">
            <UBadge color="neutral" variant="subtle">{{ row.original.plan }}</UBadge>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :color="row.original.status === 'ACTIVE' ? 'success' : row.original.status === 'PENDING_PAYMENT' ? 'neutral' : 'warning'"
              variant="subtle"
            >
              {{ row.original.status === 'ACTIVE' ? 'Ativa' : row.original.status === 'PENDING_PAYMENT' ? 'Aguardando pagamento' : 'Suspensa' }}
            </UBadge>
          </template>

          <template #createdAt-cell="{ row }">
            {{ dateFmt.format(new Date(row.original.createdAt)) }}
          </template>

          <template #actions-cell="{ row }">
            <div class="flex justify-end">
              <UDropdownMenu :items="rowActions(row.original)" :content="{ align: 'end' }">
                <UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis-vertical" />
              </UDropdownMenu>
            </div>
          </template>
        </UTable>
      </UCard>

      <TenantFormModal v-model:open="formOpen" :tenant="editing" @submitted="onSubmitted" />
    </template>
  </UDashboardPanel>
</template>
