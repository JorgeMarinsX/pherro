<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)
const code = computed(() => props.error.statusCode ?? 500)

const title = computed(() =>
  isNotFound.value ? 'Página não encontrada' : 'Algo deu errado',
)
const message = computed(() =>
  isNotFound.value
    ? 'O endereço que você acessou não existe ou o veículo pode ter sido removido.'
    : 'Tivemos um problema inesperado. Tente novamente em instantes.',
)

useSeoMeta({ title: () => `${code.value} — Pherro` })

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <SiteHeader />

    <main class="flex flex-1 items-center justify-center px-6 py-16">
      <div class="w-full max-w-lg text-center">
        <div class="mx-auto flex size-20 items-center justify-center rounded-full bg-primary-500/10">
          <UIcon
            :name="isNotFound ? 'i-lucide-car-front' : 'i-lucide-triangle-alert'"
            class="size-10 text-primary-600"
          />
        </div>

        <p class="mt-8 text-7xl font-extrabold tracking-tight text-primary-600 sm:text-8xl">
          {{ code }}
        </p>
        <h1 class="mt-4 text-2xl font-bold text-neutral-900 sm:text-3xl">
          {{ title }}
        </h1>
        <p class="mt-3 text-base text-neutral-600">
          {{ message }}
        </p>

        <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <UButton
            size="xl"
            icon="i-lucide-home"
            label="Voltar ao início"
            class="bg-neutral-900 text-white hover:bg-neutral-800"
            @click="goHome"
          />
          <UButton
            to="/veiculos"
            size="xl"
            color="primary"
            variant="outline"
            icon="i-lucide-car"
            label="Ver veículos"
            @click="clearError()"
          />
        </div>
      </div>
    </main>
  </div>
</template>
