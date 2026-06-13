<script setup lang="ts">
useSeoMeta({
  title: 'Veículos — Pherro',
  description: 'Estoque completo de veículos seminovos com procedência garantida.',
})

const state = useVehicleList()
const {
  page, vehicles, total, totalPages, pending, error, pageSize,
  hasActiveFilters, clearFilters,
} = state
</script>

<template>
  <UContainer as="section" class="py-10 sm:py-14">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Nossos veículos
      </h1>
      <p class="mt-2 text-neutral-600">
        {{ total }} {{ total === 1 ? 'veículo disponível' : 'veículos disponíveis' }}.
      </p>
    </div>

    <div class="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <!-- Filter sidebar -->
      <aside class="lg:sticky lg:top-6 lg:self-start">
        <VehicleFilters :state="state" />
      </aside>

      <!-- Results -->
      <div>
        <div v-if="error" class="rounded-lg bg-error-50 p-6 text-error-700">
          Erro ao carregar veículos. Tente novamente.
        </div>

        <!-- Loading skeletons -->
        <div
          v-else-if="pending"
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <VehicleCardSkeleton v-for="n in pageSize" :key="n" />
        </div>

        <template v-else-if="vehicles.length > 0">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <VehicleCard
              v-for="vehicle in vehicles"
              :key="vehicle.id"
              :vehicle="vehicle"
            />
          </div>

          <div v-if="totalPages > 1" class="mt-10 flex justify-center">
            <UPagination
              v-model:page="page"
              :total="total"
              :items-per-page="pageSize"
            />
          </div>
        </template>

        <!-- Empty -->
        <UCard
          v-else
          :ui="{ root: 'border-2 border-dashed border-neutral-300 bg-neutral-50' }"
        >
          <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div class="rounded-full bg-primary-100 p-4">
              <UIcon name="i-lucide-car-front" class="size-10 text-primary-600" />
            </div>
            <p class="mt-5 text-lg font-semibold text-neutral-900">
              Nenhum veículo encontrado
            </p>
            <p class="mt-1 text-sm text-neutral-600">
              Ajuste os filtros ou limpe a busca.
            </p>
            <UButton
              v-if="hasActiveFilters"
              class="mt-5"
              color="primary"
              variant="soft"
              label="Limpar filtros"
              @click="clearFilters"
            />
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
