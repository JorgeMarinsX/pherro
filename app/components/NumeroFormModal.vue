<script setup lang="ts">
import type { VehicleWhatsapp, WhatsappFormState } from '~/types/vehicle'

const open = defineModel<boolean>('open', { default: false })

// Present = edit mode (prefill + "Editar número"). Absent = create mode ("Novo número").
const props = defineProps<{ number?: VehicleWhatsapp | null }>()

const emit = defineEmits<{ submitted: [] }>()

const { create, update } = useAdminWhatsapp()
const toast = useToast()

const isEdit = computed(() => Boolean(props.number?.id))
const title = computed(() => (isEdit.value ? 'Editar número' : 'Novo número'))

// Already-active numbers can't be toggled off here (single-active invariant);
// the switch is shown but locked on, so admins use "Definir como ativo" instead.
const lockActiveOn = computed(() => isEdit.value && props.number?.isActive === true)

function blankState(): WhatsappFormState {
  return {
    label: '',
    description: '',
    number: '',
    isActive: false,
  }
}

function fromNumber(n: VehicleWhatsapp): WhatsappFormState {
  return {
    label: n.label,
    description: n.description ?? '',
    number: n.number,
    isActive: n.isActive,
  }
}

const state = reactive<WhatsappFormState>(blankState())
const submitting = ref(false)

// Reset or prefill each time modal opens, based on passed context.
watch(open, (isOpen: boolean) => {
  if (!isOpen) return
  Object.assign(state, props.number ? fromNumber(props.number) : blankState())
})

async function onSubmit() {
  submitting.value = true
  try {
    const description = state.description.trim() || null
    if (isEdit.value && props.number) {
      // Don't send isActive:false for an already-active number — backend rejects
      // direct deactivation. Only forward isActive when turning it ON.
      const payload: Record<string, unknown> = {
        label: state.label,
        description,
        number: state.number,
      }
      if (state.isActive && !props.number.isActive) payload.isActive = true
      await update(props.number.id, payload)
    } else {
      await create({
        label: state.label,
        description,
        number: state.number,
        isActive: state.isActive || undefined,
      })
    }
    toast.add({ title: 'Número salvo', color: 'success' })
    emit('submitted')
    open.value = false
  } catch (err: unknown) {
    const message =
      (err as { data?: { message?: string } }).data?.message
      ?? 'Não foi possível salvar o número.'
    toast.add({ title: 'Erro', description: String(message), color: 'error' })
  } finally {
    submitting.value = false
  }
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
        <UFormField
          label="Descrição"
          name="description"
          help="Anotação interna — não aparece na loja."
        >
          <UTextarea
            v-model="state.description"
            :rows="2"
            placeholder="Ex.: Horário comercial, segunda a sexta."
            class="w-full"
          />
        </UFormField>

        <UFormField name="isActive">
          <USwitch
            v-model="state.isActive"
            :disabled="lockActiveOn"
            label="Definir como número ativo"
            :description="lockActiveOn
              ? 'Este já é o número ativo. Para trocar, ative outro número.'
              : 'O número ativo é usado em todos os botões de WhatsApp da loja.'"
          />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="open = false" />
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-save"
            :loading="submitting"
            :label="isEdit ? 'Salvar alterações' : 'Salvar número'"
            :ui="{ base: 'text-white' }"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
