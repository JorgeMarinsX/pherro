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
      <UCard class="mx-auto max-w-3xl">
        <template #header>
          <h3 class="font-semibold text-highlighted">Identidade da loja</h3>
        </template>

        <UForm :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nome da loja" name="shopName" required>
            <UInput v-model="state.shopName" class="w-full" />
          </UFormField>
          <UFormField label="URL do logotipo" name="logoUrl">
            <UInput v-model="state.logoUrl" placeholder="https://..." class="w-full" />
          </UFormField>
          <UFormField label="Descrição" name="description">
            <UTextarea v-model="state.description" :rows="4" class="w-full" />
          </UFormField>
          <UFormField label="Endereço" name="address">
            <UInput v-model="state.address" class="w-full" />
          </UFormField>

          <div class="flex items-center justify-end pt-2">
            <UButton type="submit" color="primary" icon="i-lucide-save" label="Salvar alterações" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
