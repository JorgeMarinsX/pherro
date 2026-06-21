<script setup lang="ts">
import type {
  AttributeCreatePayload,
  AttributeDefinition,
  AttributeFormState,
} from '~/types/attribute'
import { ATTRIBUTE_TYPE_LABELS } from '~/types/attribute'

const open = defineModel<boolean>('open', { default: false })

// Present = edit mode (prefill + "Editar atributo"). Absent = create mode ("Novo atributo").
const props = defineProps<{ attribute?: AttributeDefinition | null }>()

const emit = defineEmits<{ submitted: [] }>()

const { create, update } = useAdminAttributes()
const toast = useToast()
const submitting = ref(false)

const isEdit = computed(() => Boolean(props.attribute?.id))
const title = computed(() => (isEdit.value ? 'Editar atributo' : 'Novo atributo'))

function blankState(): AttributeFormState {
  return {
    name: '',
    slug: '',
    icon: '',
    type: 'BOOLEAN',
    options: [],
  }
}

function fromAttribute(a: AttributeDefinition): AttributeFormState {
  return {
    name: a.name,
    slug: a.slug,
    icon: a.icon ?? '',
    type: a.type,
    options: a.options ?? [],
  }
}

const state = reactive<AttributeFormState>(blankState())

// Reset or prefill each time modal opens, based on passed context.
watch(open, (isOpen: boolean) => {
  if (!isOpen) return
  Object.assign(state, props.attribute ? fromAttribute(props.attribute) : blankState())
})

const typeOptions = Object.entries(ATTRIBUTE_TYPE_LABELS).map(([value, label]) => ({ label, value }))

// Options list only relevant for ENUM type. Comma-separated text <-> array.
const optionsText = computed({
  get: () => state.options.join(', '),
  set: (v: string) => {
    state.options = v.split(',').map(o => o.trim()).filter(Boolean)
  },
})

function buildPayload(): AttributeCreatePayload {
  return {
    name: state.name,
    slug: state.slug,
    icon: state.icon || null,
    type: state.type,
    ...(state.type === 'ENUM' ? { options: state.options } : {}),
  }
}

async function onSubmit() {
  submitting.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value && props.attribute) {
      await update(props.attribute.id, payload)
    } else {
      await create(payload)
    }
    emit('submitted')
    open.value = false
  } catch {
    toast.add({
      title: 'Erro ao salvar atributo',
      description: 'Verifique os dados e tente novamente.',
      color: 'error',
    })
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
        <UFormField label="Nome" name="name" required>
          <UInput v-model="state.name" placeholder="Ex.: Ar-condicionado" class="w-full" />
        </UFormField>
        <UFormField label="Ícone" name="icon" help="Opcional. Exibido nos anúncios.">
          <IconPicker v-model="state.icon" />
        </UFormField>
        <UFormField label="Slug" name="slug" required help="Identificador único, sem espaços.">
          <UInput v-model="state.slug" placeholder="Ex.: ar-condicionado" class="w-full" />
        </UFormField>
        <UFormField label="Tipo" name="type" required>
          <USelect v-model="state.type" :items="typeOptions" value-key="value" class="w-full" />
        </UFormField>
        <UFormField
          v-if="state.type === 'ENUM'"
          label="Opções"
          name="options"
          required
          help="Separe as opções por vírgula."
        >
          <UInput v-model="optionsText" placeholder="Ex.: Couro, Tecido, Misto" class="w-full" />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="open = false" />
          <UButton type="submit" color="primary" icon="i-lucide-save" :loading="submitting" :label="isEdit ? 'Salvar alterações' : 'Salvar atributo'" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
