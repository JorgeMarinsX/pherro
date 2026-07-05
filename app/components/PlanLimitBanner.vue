<script setup lang="ts">
// Admin-wide bar shown when any plan limit passes 80% usage, with upgrade CTA.
const planUsage = usePlanUsageStore()
const { warnings } = storeToRefs(planUsage)

const worst = computed(() => warnings.value[0] ?? null)

const title = computed(() => {
  if (!worst.value) return ''
  const { label, used, limit, ratio } = worst.value
  return ratio >= 1
    ? `Limite de ${label} do plano atingido (${used}/${limit}).`
    : `Limite de ${label} quase esgotado (${used}/${limit}).`
})
</script>

<template>
  <UBanner
    v-if="worst"
    :color="worst.ratio >= 1 ? 'error' : 'warning'"
    icon="i-lucide-alert-triangle"
    :title="title"
    :actions="[{ label: 'Fazer upgrade', to: '/admin/plano', color: 'neutral', variant: 'outline', size: 'xs' }]"
  />
</template>
