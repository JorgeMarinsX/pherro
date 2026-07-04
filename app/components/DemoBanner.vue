<script setup lang="ts">
// Always-on notice for the live demo: sandbox is ephemeral, may misbehave,
// and the signup CTA stays visible the whole time. Rendered globally (app.vue),
// self-hides off the demo host.
const { isDemo, signupUrl } = useDemo()

if (isDemo.value) {
  useSeoMeta({ robots: 'noindex, nofollow' })
}
</script>

<template>
  <div
    v-if="isDemo"
    class="fixed inset-x-0 bottom-0 z-50 border-t border-amber-300 bg-amber-50/95 backdrop-blur"
  >
    <div class="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
      <p class="flex items-start gap-2 text-xs text-amber-900 sm:items-center sm:text-sm">
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0 text-amber-600 sm:mt-0" />
        <span>
          <span class="font-semibold">Ambiente de demonstração:</span>
          as alterações são descartadas ao fechar a janela e algumas funções podem não funcionar.
        </span>
      </p>
      <UButton
        :to="signupUrl"
        external
        color="primary"
        size="sm"
        icon="i-lucide-rocket"
        label="Criar minha loja grátis"
        class="shrink-0 font-semibold"
      />
    </div>
  </div>
</template>
