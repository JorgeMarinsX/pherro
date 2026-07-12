<script setup lang="ts">
// Host-agnostic shell for legal pages: served on the apex AND on tenant
// storefronts (lead-form consent links here), so no marketing CTAs.
defineProps<{ title: string, updatedAt: string }>()

const colorMode = useColorMode()
const prevMode = colorMode.preference
colorMode.preference = 'light'
onBeforeUnmount(() => { colorMode.preference = prevMode })

useHead({ bodyAttrs: { class: 'bg-white' } })
</script>

<template>
  <div class="flex min-h-screen w-full flex-col bg-white">
    <header class="border-b border-neutral-200 bg-white">
      <UContainer class="flex h-16 items-center gap-2">
        <UIcon name="i-lucide-car-front" class="size-6 text-primary-600" />
        <span class="text-lg font-extrabold tracking-tight text-neutral-900">Pherro</span>
      </UContainer>
    </header>

    <main class="flex-1">
      <UContainer class="max-w-3xl py-12">
        <h1 class="text-3xl font-extrabold tracking-tight text-neutral-900">{{ title }}</h1>
        <p class="mt-2 text-sm text-neutral-500">Última atualização: {{ updatedAt }}</p>
        <div
          class="mt-8 text-[15px] leading-7 text-neutral-700
            [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-neutral-900
            [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-neutral-900
            [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
            [&_a]:text-primary-600 [&_a]:underline [&_strong]:text-neutral-900"
        >
          <slot />
        </div>
      </UContainer>
    </main>

    <footer class="border-t border-neutral-200 bg-neutral-50">
      <UContainer class="flex items-center justify-between py-6 text-xs text-neutral-500">
        <span>© {{ new Date().getFullYear() }} Pherro. Todos os direitos reservados.</span>
        <div class="flex items-center gap-4">
          <NuxtLink to="/termos" class="hover:text-neutral-700">Termos de Uso</NuxtLink>
          <NuxtLink to="/privacidade" class="hover:text-neutral-700">Política de Privacidade</NuxtLink>
        </div>
      </UContainer>
    </footer>
  </div>
</template>
