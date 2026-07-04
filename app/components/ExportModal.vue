<script setup lang="ts" generic="T">
import type { ExportField } from '~/utils/export'
import { exportCsv, exportPdf } from '~/utils/export'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  // pt-BR noun for the modal title/filename, e.g. "Leads" / "Anúncios".
  title: string
  filenameBase: string
  fields: ExportField<T>[]
  // Fetches every row to export (already tenant-scoped by the BFF).
  fetchAll: () => Promise<T[]>
}>()

const shop = useShopConfigStore()
const toast = useToast()

// Selected field keys — all on by default.
const selected = ref<string[]>(props.fields.map((f) => f.key))

// Re-seed selection each open (fields prop is stable, but keep it fresh).
watch(open, (isOpen) => {
  if (isOpen) selected.value = props.fields.map((f) => f.key)
})

const allSelected = computed(() => selected.value.length === props.fields.length)
function toggleAll() {
  selected.value = allSelected.value ? [] : props.fields.map((f) => f.key)
}

// UCheckboxGroup items: label + value(=field key). v-model = selected keys array.
const checkboxItems = computed(() =>
  props.fields.map((f) => ({ label: f.label, value: f.key })),
)

const chosenFields = computed(() =>
  props.fields.filter((f) => selected.value.includes(f.key)),
)

const busy = ref<'pdf' | 'csv' | null>(null)

async function run(format: 'pdf' | 'csv') {
  if (chosenFields.value.length === 0) {
    toast.add({ title: 'Selecione ao menos um campo.', color: 'warning' })
    return
  }
  busy.value = format
  try {
    const rows = await props.fetchAll()
    if (rows.length === 0) {
      toast.add({ title: 'Nenhum registro para exportar.', color: 'warning' })
      return
    }
    if (format === 'csv') {
      exportCsv(rows, chosenFields.value, props.filenameBase)
    } else {
      await exportPdf(rows, chosenFields.value, props.filenameBase, {
        title: props.title,
        shopName: shop.shopName,
        logoUrl: shop.logoUrl,
      })
    }
    toast.add({ title: `Exportação concluída (${rows.length} registros).`, color: 'success' })
    open.value = false
  } catch {
    toast.add({ title: 'Falha ao exportar. Tente novamente.', color: 'error' })
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="`Exportar ${title}`" :ui="{ content: 'max-w-lg' }">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-highlighted">Campos a exportar</p>
          <UButton
            color="neutral"
            variant="link"
            size="xs"
            :label="allSelected ? 'Desmarcar todos' : 'Selecionar todos'"
            @click="toggleAll"
          />
        </div>

        <UCheckboxGroup
          v-model="selected"
          :items="checkboxItems"
          value-key="value"
          :ui="{ fieldset: 'grid grid-cols-2 gap-2' }"
        />

        <div class="flex items-center justify-end gap-2 border-t border-default pt-4">
          <UButton color="neutral" variant="ghost" label="Cancelar" :disabled="Boolean(busy)" @click="open = false" />
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-file-spreadsheet"
            label="CSV"
            :loading="busy === 'csv'"
            :disabled="Boolean(busy)"
            @click="run('csv')"
          />
          <UButton
            color="primary"
            icon="i-lucide-file-text"
            label="PDF"
            :ui="{ base: 'text-white' }"
            :loading="busy === 'pdf'"
            :disabled="Boolean(busy)"
            @click="run('pdf')"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
