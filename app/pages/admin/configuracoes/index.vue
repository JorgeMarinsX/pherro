<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Configurações — Pherro Admin' })

// TODO: useFetch('/api/admin/shop-config') + PATCH on submit.
const state = reactive({
  shopName: 'Pherro',
  logoUrl: '',
  description: '',
  address: '',
})

function onSubmit() {
  // TODO: PATCH /api/admin/shop-config.
}
</script>

<template>
  <UDashboardPanel id="admin-config">
    <template #header>
      <UDashboardNavbar title="Configurações da loja">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UForm :state="state" @submit="onSubmit">
        <div class="flex flex-col gap-1 border-b border-default pb-4">
          <h3 class="font-semibold text-highlighted">Identidade da loja</h3>
          <p class="text-sm text-muted">Informações básicas exibidas no site.</p>
        </div>

        <div class="grid gap-x-6 gap-y-4 pt-6 sm:grid-cols-2">
          <UFormField label="Nome da loja" name="shopName" required>
            <UInput v-model="state.shopName" class="w-full" />
          </UFormField>
          <UFormField label="URL do logotipo" name="logoUrl">
            <UInput v-model="state.logoUrl" placeholder="https://..." class="w-full" />
          </UFormField>
          <UFormField label="Endereço" name="address" class="sm:col-span-2">
            <UInput v-model="state.address" class="w-full" />
          </UFormField>
          <UFormField label="Descrição" name="description" class="sm:col-span-2">
            <UTextarea v-model="state.description" :rows="4" class="w-full" />
          </UFormField>
        </div>

        <div class="flex items-center justify-end border-t border-default pt-4 mt-6">
          <UButton type="submit" color="primary" icon="i-lucide-save" label="Salvar alterações" :ui="{ base: 'text-white' }" />
        </div>
      </UForm>
    </template>
  </UDashboardPanel>
</template>
