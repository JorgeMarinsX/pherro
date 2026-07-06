<script setup lang="ts">
import type { ShopConfigFormState, ShopConfigUpdatePayload, PublicShopConfig } from '~/types/shop-config'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Configurações — Pherro Admin' })

// Default tenant maroon — shown in the picker when no custom color is saved.
const DEFAULT_PRIMARY = '#8B1A1A'

const shop = useShopConfigStore()
const toast = useToast()
const saving = ref(false)

const state = reactive<ShopConfigFormState>({
  shopName: '',
  primaryColor: DEFAULT_PRIMARY,
  description: '',
  address: '',
})

// Branding images persist on upload (backend swaps URL + deletes old file);
// these refs only drive the previews and the shared store.
const logoUrl = ref<string | null>(null)
const heroImageUrl = ref<string | null>(null)
const faviconUrl = ref<string | null>(null)

// Load current values via the public BFF route (returns exactly the form fields).
const { data, error } = await useFetch<PublicShopConfig>('/api/shop-config', {
  key: 'shop-config',
})

watchEffect(() => {
  if (!data.value) return
  state.shopName = data.value.shopName ?? ''
  state.primaryColor = data.value.primaryColor ?? DEFAULT_PRIMARY
  state.description = data.value.description ?? ''
  state.address = data.value.address ?? ''
  logoUrl.value = data.value.logoUrl
  heroImageUrl.value = data.value.heroImageUrl
  faviconUrl.value = data.value.faviconUrl
})

if (error.value) {
  toast.add({ title: 'Erro ao carregar configurações', color: 'error' })
}

// Empty optional strings → null so we don't persist "".
const nullable = (v: string) => (v.trim() === '' ? null : v.trim())

function syncStore() {
  shop.apply({
    shopName: state.shopName.trim() || shop.shopName,
    logoUrl: logoUrl.value,
    heroImageUrl: heroImageUrl.value,
    faviconUrl: faviconUrl.value,
    primaryColor: state.primaryColor === DEFAULT_PRIMARY ? null : state.primaryColor,
    description: nullable(state.description),
    address: nullable(state.address),
  })
}

// Keep sidebar/header brand live as images change (uploads already persisted).
watch([logoUrl, heroImageUrl, faviconUrl], syncStore)

async function onSubmit() {
  saving.value = true
  try {
    const payload: ShopConfigUpdatePayload = {
      shopName: state.shopName.trim(),
      // Default color saves as null so future default changes reach the tenant.
      primaryColor: state.primaryColor === DEFAULT_PRIMARY ? null : state.primaryColor,
      description: nullable(state.description),
      address: nullable(state.address),
    }
    await $fetch('/api/admin/shop-config', { method: 'PATCH', body: payload })
    syncStore()
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
          <UFormField label="Endereço" name="address">
            <UInput v-model="state.address" class="w-full" />
          </UFormField>
          <UFormField label="Descrição" name="description" class="sm:col-span-2">
            <UTextarea v-model="state.description" :rows="4" class="w-full" />
          </UFormField>
        </div>

        <div class="mt-8 flex flex-col gap-1 border-b border-default pb-4">
          <h3 class="font-semibold text-highlighted">Aparência do site</h3>
          <p class="text-sm text-muted">
            Logotipo, banner, favicon e cor principal do site da sua loja.
            As imagens são salvas assim que enviadas.
          </p>
        </div>

        <div class="grid gap-x-6 gap-y-6 pt-6 sm:grid-cols-2">
          <UFormField label="Logotipo" name="logo" help="Exibido no topo do site. PNG com fundo transparente fica melhor.">
            <BrandingImageUploader v-model="logoUrl" kind="logo" hint="Até 512×512" />
          </UFormField>

          <UFormField label="Favicon" name="favicon" help="Ícone da aba do navegador. Use uma imagem quadrada.">
            <BrandingImageUploader v-model="faviconUrl" kind="favicon" hint="Recortado em 64×64" />
          </UFormField>

          <UFormField label="Banner principal" name="hero" class="sm:col-span-2" help="Imagem de fundo do topo da página inicial.">
            <BrandingImageUploader v-model="heroImageUrl" kind="hero" hint="Recomendado 1920×1080 ou maior" />
          </UFormField>

          <UFormField label="Cor principal" name="primaryColor" help="Aplicada em botões, links e destaques do site.">
            <div class="flex flex-wrap items-center gap-4">
              <UColorPicker v-model="state.primaryColor" format="hex" />
              <div class="flex flex-col gap-2">
                <UInput v-model="state.primaryColor" class="w-32 font-mono" maxlength="7" />
                <div class="size-10 rounded-md ring-1 ring-neutral-200" :style="{ backgroundColor: state.primaryColor }" />
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  label="Restaurar padrão"
                  :disabled="state.primaryColor === DEFAULT_PRIMARY"
                  @click="state.primaryColor = DEFAULT_PRIMARY"
                />
              </div>
            </div>
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
