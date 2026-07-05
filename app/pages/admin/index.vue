<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Painel — Pherro Admin' })

const formOpen = ref(false)

// Active-listings count: fetch with take=1 (we only need `total`, not the rows).
const { list } = useAdminVehicles()
const activeQuery = ref<Record<string, unknown>>({ status: 'ACTIVE', take: 1, skip: 0 })
const { data: activeData, refresh: refreshActive } = list(activeQuery, 'admin-painel-active-count')
const activeCount = computed(() => activeData.value?.total ?? 0)

// TODO: leads / views / whatsapp metrics need their own endpoints — still stubbed.
const stats = computed(() => [
  { label: 'Anúncios ativos', value: String(activeCount.value), icon: 'i-lucide-car-front', color: 'primary' },
  { label: 'Leads no mês', value: '0', icon: 'i-lucide-users', color: 'info' },
  { label: 'Visualizações', value: '0', icon: 'i-lucide-eye', color: 'success' },
  { label: 'Conversas WhatsApp', value: '0', icon: 'i-lucide-message-circle', color: 'warning' },
])

const planUsage = usePlanUsageStore()
const { summary } = storeToRefs(planUsage)

// Plan usage rows: used/limit + progress color by pressure.
const usageRows = computed(() => {
  if (!summary.value) return []
  return (Object.keys(LIMIT_LABELS) as (keyof typeof LIMIT_LABELS)[]).map((kind) => {
    const limit = planUsage.limitOf(kind)
    const used = planUsage.usedOf(kind)
    const ratio = planUsage.ratioOf(kind)
    return {
      kind,
      label: LIMIT_LABELS[kind],
      used,
      limit,
      pct: limit ? Math.min(100, Math.round(ratio * 100)) : 0,
      color: (ratio >= 1 ? 'error' : ratio >= 0.8 ? 'warning' : 'primary') as 'error' | 'warning' | 'primary',
    }
  })
})

</script>

<template>
  <UDashboardPanel id="admin-painel">
    <template #header>
      <UDashboardNavbar title="Painel">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UTooltip text="Limite de veículos do plano atingido" :disabled="!planUsage.atLimit('vehicles')">
            <UButton
              color="primary"
              icon="i-lucide-plus"
              label="Novo anúncio"
              :ui="{ base: 'text-white' }"
              :disabled="planUsage.atLimit('vehicles')"
              @click="formOpen = true"
            />
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard v-for="s in stats" :key="s.label">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-muted">{{ s.label }}</p>
            <p class="mt-1 text-2xl font-bold text-highlighted">{{ s.value }}</p>
          </div>
          <div class="rounded-lg bg-primary-500/15 p-2">
            <UIcon :name="s.icon" class="size-5 text-primary-400" />
          </div>
        </div>
      </UCard>
    </div>

    <UCard v-if="usageRows.length">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold text-highlighted">Uso do plano</h3>
            <p class="text-sm text-muted">Plano atual: {{ summary?.label }}</p>
          </div>
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-arrow-up-right"
            label="Ver planos"
            to="/admin/plano"
          />
        </div>
      </template>
      <div class="grid gap-6 sm:grid-cols-3">
        <div v-for="row in usageRows" :key="row.kind">
          <div class="mb-2 flex items-baseline justify-between gap-2">
            <span class="text-sm capitalize text-muted">{{ row.label }}</span>
            <span class="text-sm font-medium text-highlighted">
              {{ row.limit === null ? `${row.used} / Ilimitado` : `${row.used} / ${row.limit}` }}
            </span>
          </div>
          <UProgress :model-value="row.pct" :max="100" :color="row.color" size="sm" />
        </div>
      </div>
    </UCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">Anúncios recentes</h3>
        </template>
        <p class="text-sm text-muted">Nenhum anúncio cadastrado.</p>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">Últimos leads</h3>
        </template>
        <p class="text-sm text-muted">Nenhum lead recebido.</p>
      </UCard>
    </div>
      </div>

      <AnuncioFormModal v-model:open="formOpen" @submitted="refreshActive" />
    </template>
  </UDashboardPanel>
</template>
