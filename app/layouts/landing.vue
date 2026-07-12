<script setup lang="ts">
// Marketing pages are light-only — force light mode, restore on leave.
const colorMode = useColorMode()
const prevMode = colorMode.preference
colorMode.preference = 'light'
onBeforeUnmount(() => { colorMode.preference = prevMode })

useHead({
  htmlAttrs: { class: '[scrollbar-gutter:stable]' },
  bodyAttrs: { class: 'bg-white' },
})

const year = new Date().getFullYear()
</script>

<template>
  <div class="flex min-h-screen w-full flex-col">
    <header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <UContainer class="flex h-16 items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon name="i-lucide-car-front" class="size-7 text-primary-600" />
          <span class="text-xl font-extrabold tracking-tight text-neutral-900">Pherro</span>
        </NuxtLink>
        <UButton
          to="/cadastro"
          color="primary"
          label="Criar minha loja"
          trailing-icon="i-lucide-arrow-right"
        />
      </UContainer>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-neutral-200 bg-neutral-50">
      <UContainer class="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-car-front" class="size-5 text-primary-600" />
          <span class="text-sm font-semibold text-neutral-900">Pherro</span>
          <span class="text-sm text-neutral-500">— sua revenda online</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-neutral-500">
          <span>© {{ year }} Pherro. Todos os direitos reservados.</span>
          <NuxtLink to="/termos" class="hover:text-neutral-700">Termos de Uso</NuxtLink>
          <NuxtLink to="/privacidade" class="hover:text-neutral-700">Privacidade</NuxtLink>
          <NuxtLink to="/platform/login" class="hover:text-neutral-700">Acesso da plataforma</NuxtLink>
        </div>
      </UContainer>
    </footer>
  </div>
</template>
