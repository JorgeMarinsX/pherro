<script setup lang="ts">

useHead({
  htmlAttrs: { class: '[scrollbar-gutter:stable]' },
  bodyAttrs: { class: 'bg-white' },
})
</script>

<template>
    <div class="w-full min-h-screen">
    <SiteHeader />
    <slot />
    </div>
</template>
