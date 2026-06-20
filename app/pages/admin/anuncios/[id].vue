<script setup lang="ts">
import type { VehicleDetail } from '~/types/vehicle'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const vehicleId = computed(() => route.params.id as string)

useHead({ title: 'Editar anúncio — Pherro Admin' })

// Option B: this route is just an entry point into the shared edit modal. Fetch
// the detail, open the modal prefilled; on close, return to the list.
const { data: vehicle, error } = await useAsyncData<VehicleDetail | null>(
  () => `admin-veiculo-${vehicleId.value}`,
  () => useAdminVehicles().get(vehicleId.value),
  { default: () => null },
)

const notFound = computed(() => Boolean(error.value) || !vehicle.value)

const open = ref(!notFound.value)

// Closing the modal (cancel or after save) returns to the list.
watch(open, (isOpen) => {
  if (!isOpen) router.push('/admin/anuncios')
})

function onSubmitted() {
  router.push('/admin/anuncios')
}
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
      <UCard v-if="notFound" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-elevated p-4">
            <UIcon name="i-lucide-search-x" class="size-10 text-muted" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Anúncio não encontrado</p>
          <p class="mt-1 text-sm text-muted">Pode ter sido excluído ou o link está incorreto.</p>
          <UButton
            to="/admin/anuncios"
            color="primary"
            icon="i-lucide-arrow-left"
            label="Voltar aos anúncios"
            class="mt-5"
            :ui="{ base: 'text-white' }"
          />
        </div>
      </UCard>

      <AnuncioFormModal
        v-else
        v-model:open="open"
        :vehicle="vehicle"
        @submitted="onSubmitted"
      />
    </template>
  </UDashboardPanel>
</template>
