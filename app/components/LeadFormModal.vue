<script setup lang="ts">
import type { Lead, LeadFormState } from '~/types/lead'
import { LEAD_SOURCE_LABELS } from '~/types/lead'

const open = defineModel<boolean>('open', { default: false })

// Present = edit mode (prefill + "Editar lead"). Absent = create mode ("Novo lead").
const props = defineProps<{ lead?: Lead | null }>()

const emit = defineEmits<{ submitted: [] }>()

const isEdit = computed(() => Boolean(props.lead?.id))
const title = computed(() => (isEdit.value ? 'Editar lead' : 'Novo lead'))

function blankState(): LeadFormState {
  return {
    name: '',
    phone: '',
    email: '',
    notes: '',
    source: 'MANUAL',
  }
}

function fromLead(l: Lead): LeadFormState {
  return {
    name: l.name,
    phone: l.phone,
    email: l.email ?? '',
    notes: l.notes ?? '',
    source: l.source,
  }
}

// TODO: wire submit to POST/PATCH /api/admin/leads.
const state = reactive<LeadFormState>(blankState())

// Reset or prefill each time modal opens, based on passed context.
watch(open, (isOpen: boolean) => {
  if (!isOpen) return
  Object.assign(state, props.lead ? fromLead(props.lead) : blankState())
})

const sourceOptions = Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({ label, value }))

function onSubmit() {
  // TODO: POST (create) or PATCH `/api/admin/leads/${props.lead?.id}` (edit).
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
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nome" name="name" required class="sm:col-span-2">
            <UInput v-model="state.name" placeholder="Ex.: João Silva" class="w-full" />
          </UFormField>
          <UFormField label="Telefone" name="phone" required>
            <UInput v-model="state.phone" placeholder="Ex.: +55 11 99999-9999" class="w-full" />
          </UFormField>
          <UFormField label="E-mail" name="email">
            <UInput v-model="state.email" type="email" placeholder="joao@email.com" class="w-full" />
          </UFormField>
          <UFormField label="Origem" name="source" required class="sm:col-span-2">
            <USelect v-model="state.source" :items="sourceOptions" value-key="value" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Observações" name="notes">
          <UTextarea v-model="state.notes" :rows="4" placeholder="Notas sobre o lead..." class="w-full" />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="open = false" />
          <UButton type="submit" color="primary" icon="i-lucide-save" :label="isEdit ? 'Salvar alterações' : 'Salvar lead'" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
