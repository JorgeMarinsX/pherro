<script setup lang="ts">
// Loading placeholder mirroring VehicleCard's layout (aspect-4/5, badge top,
// title + price + spec badges bottom).
</script>

<template>
  <div class="relative isolate aspect-4/5 overflow-hidden rounded-lg bg-neutral-100 p-4">
    <div class="flex h-full flex-col">
      <USkeleton class="size-6 w-12 rounded-md" />

      <div class="mt-auto space-y-3">
        <div class="space-y-2">
          <USkeleton class="h-5 w-3/4" />
          <USkeleton class="h-6 w-1/2" />
        </div>
        <div class="flex flex-wrap gap-1.5">
          <USkeleton class="h-5 w-20 rounded-full" />
          <USkeleton class="h-5 w-16 rounded-full" />
          <USkeleton class="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  </div>
</template>
