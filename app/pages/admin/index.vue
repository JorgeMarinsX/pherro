<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Painel — Pherro Admin' })

// TODO: load real metrics from API.
const stats = [
  { label: 'Anúncios ativos', value: '0', icon: 'i-lucide-car-front', color: 'primary' },
  { label: 'Leads no mês', value: '0', icon: 'i-lucide-users', color: 'info' },
  { label: 'Visualizações', value: '0', icon: 'i-lucide-eye', color: 'success' },
  { label: 'Conversas WhatsApp', value: '0', icon: 'i-lucide-message-circle', color: 'warning' },
] as const
</script>

<template>
  <UDashboardPanel id="admin-painel">
    <template #header>
      <UDashboardNavbar title="Painel">
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
    </template>
  </UDashboardPanel>
</template>
