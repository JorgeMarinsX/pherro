<script setup lang="ts">
// Dark chrome — force dark mode here, restore on leave.
const colorMode = useColorMode()
const prevMode = colorMode.preference
colorMode.preference = 'dark'
onBeforeUnmount(() => { colorMode.preference = prevMode })

// Car placeholder from Pexels CDN (no auth, cached).
const carImage =
  'https://images.pexels.com/photos/100656/pexels-photo-100656.jpeg?auto=compress&cs=tinysrgb&w=1260&h=1800&dpr=2'
</script>

<template>
  <div class="theme-platform relative flex min-h-screen bg-zinc-950 text-white">
    <!-- Form side (left on desktop). On mobile it overlays the bg image. -->
    <div class="relative z-10 flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
      <slot />
    </div>

    <!-- Image side (right on desktop). On mobile: full-bleed background. -->
    <div
      class="absolute inset-0 lg:static lg:w-1/2"
      :style="{ backgroundImage: `url('${carImage}')` }"
      style="background-size: cover; background-position: center"
    >
      <!-- Darken on mobile so the form reads; keep a brand gradient on desktop. -->
      <div class="absolute inset-0 bg-zinc-950/80 lg:bg-linear-to-l lg:from-transparent lg:via-zinc-950/40 lg:to-zinc-950" />
      <div class="relative hidden h-full flex-col justify-end p-12 lg:flex">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-building-2" class="size-10 shrink-0 text-primary-400" />
          <p class="text-3xl font-extrabold tracking-tight">Pherro | Plataforma administrativa</p>
        </div>
        <p class="mt-3 max-w-sm text-zinc-300">
          Central de controle das lojas. Provisione, gerencie e monitore cada revenda.
        </p>
      </div>
    </div>
  </div>
</template>
