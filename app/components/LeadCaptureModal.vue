<script setup lang="ts">
// Storefront WhatsApp gate: quick lead form shown before the CTA reveals.
// Capture is best-effort — a failed POST never blocks the visitor's contact.
const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  vehicleId: string
  vehicleLabel: string
  whatsappHref: string
}>()

// Fired on successful gate pass — parent persists the "already captured" flag.
const emit = defineEmits<{ captured: [] }>()

const state = reactive({ name: '', phone: '', email: '' })
const loading = ref(false)
const errorMsg = ref('')

watch(open, (isOpen: boolean) => {
  if (isOpen) errorMsg.value = ''
})

function validate(): string | null {
  if (!state.name.trim()) return 'Informe seu nome.'
  if (state.phone.replace(/\D/g, '').length < 10) return 'Informe um telefone válido com DDD.'
  if (state.email && !/^\S+@\S+\.\S+$/.test(state.email)) return 'Informe um e-mail válido.'
  return null
}

async function onSubmit() {
  const invalid = validate()
  if (invalid) {
    errorMsg.value = invalid
    return
  }
  errorMsg.value = ''
  loading.value = true
  try {
    await $fetch('/api/leads', {
      method: 'POST',
      body: {
        name: state.name.trim(),
        phone: state.phone.trim(),
        email: state.email.trim() || undefined,
        vehicleId: props.vehicleId,
      },
    })
  } catch {
    // Never lose the sale over a failed capture (throttle/quota/outage).
  } finally {
    loading.value = false
  }
  emit('captured')
  open.value = false
  window.open(props.whatsappHref, '_blank', 'noopener')
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Fale com o vendedor"
    :description="`Deixe seu contato para falar sobre o ${props.vehicleLabel}.`"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nome" name="name" required>
          <UInput v-model="state.name" placeholder="Ex.: João Silva" autocomplete="name" class="w-full" />
        </UFormField>
        <UFormField label="Telefone (WhatsApp)" name="phone" required>
          <UInput v-model="state.phone" type="tel" placeholder="Ex.: (11) 99999-9999" autocomplete="tel" class="w-full" />
        </UFormField>
        <UFormField label="E-mail" name="email" hint="Opcional">
          <UInput v-model="state.email" type="email" placeholder="joao@email.com" autocomplete="email" class="w-full" />
        </UFormField>

        <UAlert
          v-if="errorMsg"
          color="error"
          variant="subtle"
          :description="errorMsg"
        />

        <p class="text-xs text-neutral-500">
          Ao continuar, você autoriza a loja a entrar em contato pelos dados
          informados, conforme a
          <NuxtLink to="/privacidade" target="_blank" class="underline hover:text-neutral-700">
            Política de Privacidade
          </NuxtLink>.
        </p>

        <UButton
          type="submit"
          size="lg"
          icon="i-simple-icons-whatsapp"
          label="Continuar para o WhatsApp"
          block
          :loading="loading"
          class="bg-neutral-900 text-white hover:bg-neutral-800"
        />
      </UForm>
    </template>
  </UModal>
</template>
