<script setup lang="ts">
// Force vertical scrollbar on every page so the viewport width stays constant
// — prevents the layout shift when navigating between short (no scrollbar) and
// tall (scrollbar) pages.
useHead({
  title: 'Pherro',
  htmlAttrs: { class: 'overflow-y-scroll' },
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
