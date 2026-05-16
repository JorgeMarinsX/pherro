<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'WhatsApp — Pherro Admin' })

// TODO: useFetch('/api/admin/whatsapp-numbers').
const numbers = ref<Array<{ id: string; label: string; number: string }>>([])
</script>

<template>
  <UDashboardPanel id="admin-whatsapp">
    <template #header>
      <UDashboardNavbar title="Números WhatsApp">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="primary" icon="i-lucide-plus" label="Novo número" :ui="{ base: 'text-white' }" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard v-if="numbers.length === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-message-circle" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhum número cadastrado</p>
          <p class="mt-1 text-sm text-muted">
            Adicione números para que clientes possam contatar a loja.
          </p>
          <UButton color="primary" icon="i-lucide-plus" label="Novo número" class="mt-5" :ui="{ base: 'text-white' }" />
        </div>
      </UCard>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <UCard v-for="n in numbers" :key="n.id">
          <div class="flex items-start justify-between">
            <div>
              <p class="font-semibold text-highlighted">{{ n.label }}</p>
              <p class="mt-1 text-sm text-muted">{{ n.number }}</p>
            </div>
            <UDropdownMenu
              :items="[
                [{ label: 'Editar', icon: 'i-lucide-pencil' }, { label: 'Remover', icon: 'i-lucide-trash-2', color: 'error' }],
              ]"
            >
              <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" />
            </UDropdownMenu>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
