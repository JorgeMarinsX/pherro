<script setup lang="ts">
import { isPlatformHost } from '~~/shared/host'

// Host dispatcher: apex/www render the product LP; tenant hosts render the storefront.
definePageMeta({ layout: false })

const url = useRequestURL()
const config = useRuntimeConfig()
const isPlatform = isPlatformHost(url.hostname, config.public.appBaseDomain)
</script>

<template>
  <NuxtLayout v-if="isPlatform" name="landing">
    <LandingHome />
  </NuxtLayout>
  <NuxtLayout v-else name="default">
    <StorefrontHome />
  </NuxtLayout>
</template>