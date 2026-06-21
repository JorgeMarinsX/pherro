<script setup lang="ts">
import { LUCIDE_ATTRIBUTE_ICONS } from '~/utils/lucideIcons'

// Model = the Iconify name (`i-lucide-…`) or '' for none.
const model = defineModel<string>({ default: '' })

const open = ref(false)
const search = ref('')

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return LUCIDE_ATTRIBUTE_ICONS
  return LUCIDE_ATTRIBUTE_ICONS.filter(name => name.includes(term))
})

function select(name: string) {
  model.value = name
  open.value = false
}

function clear() {
  model.value = ''
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start' }">
    <UButton
      color="neutral"
      variant="outline"
      class="w-full justify-start"
      :icon="model || 'i-lucide-image-plus'"
    >
      {{ model || 'Selecionar ícone' }}
    </UButton>

    <template #content>
      <div class="w-72 p-3">
        <UInput
          v-model="search"
          placeholder="Buscar ícone…"
          icon="i-lucide-search"
          class="w-full"
        />
        <div class="mt-3 grid max-h-60 grid-cols-6 gap-1 overflow-y-auto">
          <UButton
            v-for="name in filtered"
            :key="name"
            color="neutral"
            :variant="name === model ? 'solid' : 'ghost'"
            :icon="name"
            square
            :aria-label="name"
            @click="select(name)"
          />
        </div>
        <p v-if="!filtered.length" class="py-4 text-center text-sm text-muted">
          Nenhum ícone encontrado.
        </p>
        <UButton
          color="neutral"
          variant="link"
          icon="i-lucide-x"
          label="Nenhum"
          class="mt-2"
          @click="clear"
        />
      </div>
    </template>
  </UPopover>
</template>
