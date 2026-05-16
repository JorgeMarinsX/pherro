<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const vehicleId = computed(() => route.params.id as string)

useHead({ title: 'Editar anúncio — Pherro Admin' })

// TODO: useFetch(`/api/admin/vehicles/${vehicleId}`).
</script>

<template>
  <UDashboardPanel id="admin-anuncio-editar">
    <template #header>
      <UDashboardNavbar title="Editar anúncio">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            to="/admin/anuncios"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            label="Voltar"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-highlighted">Dados do veículo</h3>
              <UBadge color="neutral" variant="subtle" :label="`ID: ${vehicleId}`" />
            </div>
          </template>
          <p class="text-sm text-muted">
            Formulário de edição será carregado aqui.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">Fotos</h3>
          </template>
          <p class="text-sm text-muted">Gerenciador de fotos (upload, ordenação).</p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold text-highlighted">Atributos</h3>
          </template>
          <p class="text-sm text-muted">Seleção de atributos do catálogo.</p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
