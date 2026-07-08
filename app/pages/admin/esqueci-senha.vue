<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useHead({ title: 'Recuperar senha — Pherro Admin' })

const toast = useToast()

const state = reactive({
  email: '',
})

const loading = ref(false)
const sent = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: state.email },
    })
    sent.value = true
  } catch (err: unknown) {
    const message =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Falha ao processar a solicitação'
    toast.add({ title: 'Erro', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <div class="flex flex-col items-center gap-2 text-center">
        <UIcon name="i-lucide-key-round" class="size-10 text-primary-400" />
        <h1 class="text-xl font-bold text-highlighted">Recuperar senha</h1>
        <p class="text-sm text-muted">
          Informe seu e-mail e enviaremos um link para redefinir a senha
        </p>
      </div>
    </template>

    <div v-if="sent" class="flex flex-col items-center gap-3 text-center py-4">
      <UIcon name="i-lucide-mail-check" class="size-8 text-success" />
      <p class="text-sm text-muted">
        Se o e-mail estiver cadastrado, você receberá um link de redefinição em
        instantes. Verifique também a caixa de spam.
      </p>
    </div>

    <UForm v-else :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="E-mail" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          icon="i-lucide-mail"
          placeholder="voce@loja.com"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        label="Enviar link"
        :ui="{ base: 'text-white' }"
      />
    </UForm>

    <template #footer>
      <div class="text-center text-sm text-muted">
        <NuxtLink to="/admin/login" class="hover:text-primary-400">Voltar para o login</NuxtLink>
      </div>
    </template>
  </UCard>
</template>
