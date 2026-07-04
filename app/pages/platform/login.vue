<script setup lang="ts">
definePageMeta({
  layout: 'platform-auth',
})

useHead({ title: 'Entrar — Pherro | Plataforma administrativa' })

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
  <div class="w-full max-w-sm">
    <div class="mb-8">
      <div class="flex items-center gap-3">
        <div class="rounded-xl bg-primary-500/15 p-3 ring-1 ring-primary-500/30">
          <UIcon name="i-lucide-building-2" class="size-8 text-primary-400" />
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-white">Pherro | Plataforma administrativa</h1>
      </div>
      <p class="mt-3 text-sm text-zinc-400">Central de controle — acesso restrito.</p>
    </div>

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

      <!-- TODO: implement password recovery flow — link disabled until it exists. -->
      <div class="flex justify-end">
        <UButton
          variant="link"
          size="sm"
          color="primary"
          label="Recuperar senha"
          disabled
          :padded="false"
        />
      </div>

      <UButton
        type="submit"
        color="primary"
        block
        size="lg"
        :loading="loading"
        label="Entrar"
        :ui="{ base: 'text-white font-semibold' }"
      />
    </UForm>

    <p class="mt-8 text-center text-xs text-zinc-500 lg:text-left">
      Não é uma loja? Administradores de loja acessam pelo domínio da loja.
    </p>
  </div>
</template>
