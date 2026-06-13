<script setup lang="ts">
useHead({
  title: 'Pherro'
})
</script>

<template>


  <UApp :scroll-body="false">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
