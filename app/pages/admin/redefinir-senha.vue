<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useHead({ title: 'Redefinir senha — Pherro Admin' })

const route = useRoute()
const toast = useToast()

const token = typeof route.query.token === 'string' ? route.query.token : ''

const state = reactive({
  password: '',
  confirm: '',
})

const loading = ref(false)

function validate(s: typeof state) {
  const errors = []
  if (s.password && s.password.length < 8) {
    errors.push({ name: 'password', message: 'Mínimo de 8 caracteres' })
  }
  if (s.confirm && s.confirm !== s.password) {
    errors.push({ name: 'confirm', message: 'As senhas não coincidem' })
  }
  return errors
}

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: state.password },
    })
    toast.add({
      title: 'Senha redefinida',
      description: 'Entre com a nova senha.',
      color: 'success',
    })
    await navigateTo('/admin/login')
  } catch (err: unknown) {
    const message =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Falha ao redefinir a senha'
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
        <UIcon name="i-lucide-lock-keyhole" class="size-10 text-primary-400" />
        <h1 class="text-xl font-bold text-highlighted">Redefinir senha</h1>
        <p class="text-sm text-muted">Crie uma nova senha para sua conta</p>
      </div>
    </template>

    <div v-if="!token" class="flex flex-col items-center gap-3 text-center py-4">
      <UIcon name="i-lucide-link-2-off" class="size-8 text-error" />
      <p class="text-sm text-muted">
        Link inválido. Solicite uma nova redefinição de senha.
      </p>
      <UButton
        to="/admin/esqueci-senha"
        color="primary"
        variant="soft"
        label="Solicitar novo link"
      />
    </div>

    <UForm v-else :state="state" :validate="validate" class="space-y-4" @submit="onSubmit">
      <UFormField label="Nova senha" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="new-password"
          icon="i-lucide-lock"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Confirmar nova senha" name="confirm" required>
        <UInput
          v-model="state.confirm"
          type="password"
          autocomplete="new-password"
          icon="i-lucide-lock"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        label="Redefinir senha"
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
