<script setup lang="ts">
import type { Tenant, TenantFormState } from '~/types/tenant'

const open = defineModel<boolean>('open', { default: false })

// Present = edit mode (name/plan only). Absent = create mode (full provisioning).
const props = defineProps<{ tenant?: Tenant | null }>()

const emit = defineEmits<{ submitted: [] }>()

const { create, update } = usePlatformTenants()
const config = useRuntimeConfig()
const toast = useToast()
const submitting = ref(false)

const isEdit = computed(() => Boolean(props.tenant?.id))
const title = computed(() => (isEdit.value ? 'Editar loja' : 'Nova loja'))

function blankState(): TenantFormState {
  return { slug: '', name: '', adminEmail: '', adminPassword: '', plan: 'free' }
}

const state = reactive<TenantFormState>(blankState())

watch(open, (isOpen: boolean) => {
  if (!isOpen) return
  Object.assign(state, blankState())
  if (props.tenant) {
    state.slug = props.tenant.slug
    state.name = props.tenant.name
    state.plan = props.tenant.plan
  }
})

// Suggest slug from name until the user types their own.
const slugTouched = ref(false)
watch(() => state.name, (name: string) => {
  if (isEdit.value || slugTouched.value) return
  state.slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
})
watch(open, (isOpen: boolean) => {
  if (isOpen) slugTouched.value = false
})

const siteHost = computed(() =>
  state.slug ? `${state.slug}.${config.public.appBaseDomain}` : '',
)

async function onSubmit() {
  submitting.value = true
  try {
    if (isEdit.value && props.tenant) {
      await update(props.tenant.id, { name: state.name, plan: state.plan })
    } else {
      await create({
        slug: state.slug,
        name: state.name,
        adminEmail: state.adminEmail,
        adminPassword: state.adminPassword,
        plan: state.plan,
      })
    }
    emit('submitted')
    open.value = false
  } catch (err: unknown) {
    const message =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Verifique os dados e tente novamente.'
    toast.add({ title: 'Erro ao salvar loja', description: message, color: 'error' })
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
          <UInput v-model="state.name" placeholder="Ex.: AutoCenter Silva" class="w-full" />
        </UFormField>

        <UFormField
          label="Slug"
          name="slug"
          required
          :help="siteHost ? `Site: ${siteHost}` : 'Endereço do site da loja.'"
        >
          <UInput
            v-model="state.slug"
            placeholder="Ex.: autocenter-silva"
            class="w-full"
            :disabled="isEdit"
            @input="slugTouched = true"
          />
        </UFormField>

        <template v-if="!isEdit">
          <UFormField label="E-mail do administrador" name="adminEmail" required help="Primeiro acesso da loja.">
            <UInput v-model="state.adminEmail" type="email" placeholder="dono@loja.com" class="w-full" />
          </UFormField>

          <UFormField label="Senha do administrador" name="adminPassword" required help="Mínimo de 8 caracteres.">
            <UInput v-model="state.adminPassword" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
        </template>

        <UFormField label="Plano" name="plan" required>
          <UInput v-model="state.plan" placeholder="free" class="w-full" />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" @click="open = false" />
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-save"
            :loading="submitting"
            :label="isEdit ? 'Salvar alterações' : 'Criar loja'"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
