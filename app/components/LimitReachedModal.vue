<script setup lang="ts">
// Global dialog for quota 403s — opened via usePlanUsageStore().showLimitDialog().
const planUsage = usePlanUsageStore()
const { dialogOpen, dialogMessage } = storeToRefs(planUsage)
</script>

<template>
  <UModal v-model:open="dialogOpen" title="Limite do plano atingido">
    <template #body>
      <div class="flex items-start gap-3">
        <div class="rounded-full bg-error-500/15 p-2">
          <UIcon name="i-lucide-alert-triangle" class="size-5 text-error-500" />
        </div>
        <p class="text-sm text-muted">{{ dialogMessage }}</p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Fechar" @click="dialogOpen = false" />
        <UButton
          color="primary"
          icon="i-lucide-arrow-up-right"
          label="Fazer upgrade"
          :ui="{ base: 'text-white' }"
          to="/admin/plano"
          @click="dialogOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>
