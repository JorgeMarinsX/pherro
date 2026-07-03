<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useHead({ title: 'Entrar — Pherro Plataforma' })

const route = useRoute()
const toast = useToast()

const state = reactive({
  email: '',
  password: '',
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    const res = await $fetch<{ role: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: state.email, password: state.password },
    })
    // Tenant-admin creds on the platform host log in as a tenant session — reject.
    if (res.role !== 'PLATFORM_ADMIN') {
      await $fetch('/api/auth/logout', { method: 'POST' })
      toast.add({
        title: 'Acesso negado',
        description: 'Use uma conta de administrador da plataforma.',
        color: 'error',
      })
      return
    }
    // Same-site internal paths only (open-redirect guard).
    const raw = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const redirect = /^\/(?!\/)/.test(raw) ? raw : '/platform'
    await navigateTo(redirect)
  } catch (err: unknown) {
    const message =
      (err as { data?: { statusMessage?: string }; statusMessage?: string })?.data
        ?.statusMessage ??
      (err as { statusMessage?: string })?.statusMessage ??
      'Falha ao entrar'
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
        <UIcon name="i-lucide-building-2" class="size-10 text-primary-400" />
        <h1 class="text-xl font-bold text-highlighted">Pherro Plataforma</h1>
        <p class="text-sm text-muted">Entre para gerenciar as lojas</p>
      </div>
    </template>

    <UForm :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="E-mail" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          icon="i-lucide-mail"
          placeholder="voce@pherro.app"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Senha" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="current-password"
          icon="i-lucide-lock"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        label="Entrar"
        :ui="{ base: 'text-white' }"
      />
    </UForm>
  </UCard>
</template>
