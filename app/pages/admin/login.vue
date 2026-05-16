<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useHead({ title: 'Entrar — Pherro Admin' })

const state = reactive({
  email: '',
  password: '',
})

const loading = ref(false)

async function onSubmit() {
  loading.value = true
  // TODO: call Supabase Auth signInWithPassword, then navigateTo('/admin').
  loading.value = false
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <div class="flex flex-col items-center gap-2 text-center">
        <UIcon name="i-lucide-car-front" class="size-10 text-primary-400" />
        <h1 class="text-xl font-bold text-highlighted">Pherro Admin</h1>
        <p class="text-sm text-muted">Entre para gerenciar a loja</p>
      </div>
    </template>

    <UForm :state="state" class="space-y-4" @submit="onSubmit">
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

    <template #footer>
      <div class="text-center text-sm text-muted">
        <NuxtLink to="/" class="hover:text-primary-400">Voltar para o site</NuxtLink>
      </div>
    </template>
  </UCard>
</template>
