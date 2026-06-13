<script setup lang="ts">
import type { VehicleListState } from '~/composables/useVehicleList'

const props = defineProps<{ state: VehicleListState }>()

// Destructure into local bindings so the template reads clean (no state.x everywhere).
// Refs stay reactive through destructure.
const {
  search, make, yearMin, yearMax, priceMin, priceMax,
  transmission, fuelType, sort,
  sortOptions, transmissionOptions, fuelOptions,
  minYear, maxYear, isValidYear, hasActiveFilters, clearFilters,
} = props.state
</script>

<template>
  <UCard :ui="{ body: 'space-y-5' }">
    <div class="flex h-6 items-center justify-between">
      <h2 class="text-sm font-semibold text-neutral-900">Filtros</h2>
      <UButton
        color="neutral"
        variant="link"
        size="xs"
        label="Limpar"
        :class="hasActiveFilters ? 'visible' : 'invisible'"
        @click="clearFilters"
      />
    </div>

    <UFormField label="Buscar" name="q">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Marca ou modelo..."
        class="w-full"
      />
    </UFormField>

    <UFormField label="Marca" name="make">
      <UInput v-model="make" placeholder="Ex.: Toyota" class="w-full" />
    </UFormField>

    <UFormField label="Ano" name="year">
      <div class="flex items-center gap-2">
        <UInput
          v-model.number="yearMin"
          type="number"
          :min="minYear"
          :max="maxYear"
          placeholder="De"
          class="w-full"
        />
        <span class="text-neutral-400">–</span>
        <UInput
          v-model.number="yearMax"
          type="number"
          :min="isValidYear(yearMin) ? yearMin : minYear"
          :max="maxYear"
          placeholder="Até"
          class="w-full"
        />
      </div>
    </UFormField>

    <UFormField label="Preço (R$)" name="price">
      <div class="flex items-center gap-2">
        <UInput v-model.number="priceMin" type="number" placeholder="Mín" class="w-full" />
        <span class="text-neutral-400">–</span>
        <UInput v-model.number="priceMax" type="number" placeholder="Máx" class="w-full" />
      </div>
    </UFormField>

    <UFormField label="Câmbio" name="transmission">
      <USelect
        v-model="transmission"
        :items="transmissionOptions"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Combustível" name="fuelType">
      <USelect
        v-model="fuelType"
        :items="fuelOptions"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Ordenar por" name="sort">
      <USelect
        v-model="sort"
        :items="sortOptions"
        value-key="value"
        class="w-full"
      />
    </UFormField>
  </UCard>
</template>
