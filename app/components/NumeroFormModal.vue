<script setup lang="ts">
import type { VehicleWhatsapp, WhatsappFormState } from '~/types/vehicle'

const open = defineModel<boolean>('open', { default: false })

// Present = edit mode (prefill + "Editar número"). Absent = create mode ("Novo número").
const props = defineProps<{ number?: VehicleWhatsapp | null }>()

const emit = defineEmits<{ submitted: [] }>()

const isEdit = computed(() => Boolean(props.number?.id))
const title = computed(() => (isEdit.value ? 'Editar número' : 'Novo número'))

function blankState(): WhatsappFormState {
  return {
    label: '',
    number: '',
  }
}

function fromNumber(n: VehicleWhatsapp): WhatsappFormState {
  return {
    label: n.label,
    number: n.number,
  }
}

// TODO: wire submit to POST/PATCH /api/admin/whatsapp-numbers.
const state = reactive<WhatsappFormState>(blankState())

// Reset or prefill each time modal opens, based on passed context.
watch(open, (isOpen: boolean) => {
  if (!isOpen) return
  Object.assign(state, props.number ? fromNumber(props.number) : blankState())
})

function onSubmit() {
  // TODO: POST (create) or PATCH `/api/admin/whatsapp-numbers/${props.number?.id}` (edit).
  emit('submitted')
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Identificação" name="label" required help="Ex.: Vendas, Pós-venda.">
          <UInput v-model="state.label" placeholder="Ex.: Vendas" class="w-full" />
        </UFormField>
        <UFormField label="Número" name="number" required>
          <UInput v-model="state.number" placeholder="Ex.: +55 11 99999-9999" class="w-full" />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="open = false" />
          <UButton type="submit" color="primary" icon="i-lucide-save" :label="isEdit ? 'Salvar alterações' : 'Salvar número'" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
