<script setup lang="ts">
import type { ShopConfigFormState, ShopConfigUpdatePayload, PublicShopConfig } from '~/types/shop-config'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Configurações — Pherro Admin' })

const shop = useShopConfigStore()
const toast = useToast()
const saving = ref(false)

const state = reactive<ShopConfigFormState>({
  shopName: '',
  logoUrl: '',
  description: '',
  address: '',
})

// Load current values via the public BFF route (returns exactly the form fields).
const { data, error } = await useFetch<PublicShopConfig>('/api/shop-config', {
  key: 'shop-config',
})

watchEffect(() => {
  if (!data.value) return
  state.shopName = data.value.shopName ?? ''
  state.logoUrl = data.value.logoUrl ?? ''
  state.description = data.value.description ?? ''
  state.address = data.value.address ?? ''
})

if (error.value) {
  toast.add({ title: 'Erro ao carregar configurações', color: 'error' })
}

// Empty optional strings → null so we don't persist "".
const nullable = (v: string) => (v.trim() === '' ? null : v.trim())

async function onSubmit() {
  saving.value = true
  try {
    const payload: ShopConfigUpdatePayload = {
      shopName: state.shopName.trim(),
      logoUrl: nullable(state.logoUrl),
      description: nullable(state.description),
      address: nullable(state.address),
    }
    await $fetch('/api/admin/shop-config', { method: 'PATCH', body: payload })
    // Keep the shared store (sidebar/header brand) in sync with the saved values.
    shop.apply({
      shopName: payload.shopName!,
      logoUrl: payload.logoUrl ?? null,
      description: payload.description ?? null,
      address: payload.address ?? null,
    })
    toast.add({ title: 'Configurações salvas', color: 'success' })
  } catch {
    toast.add({ title: 'Erro ao salvar configurações', color: 'error' })
  } finally {
    saving.value = false
  }
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
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-save"
            label="Salvar alterações"
            :loading="saving"
            :ui="{ base: 'text-white' }"
          />
        </div>
      </UForm>
    </template>
  </UDashboardPanel>
</template>
