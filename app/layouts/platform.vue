<script setup lang="ts">
const auth = useAuthStore()
const { email } = storeToRefs(auth)

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  auth.$reset()
  await navigateTo('/platform/login')
}

const links = ref([
  [
    { label: 'Lojas', icon: 'i-lucide-store', to: '/platform' },
  ],
])

const userMenu = computed(() => [
  [
    { label: email.value ?? 'Plataforma', type: 'label' as const },
  ],
  [
    { label: 'Sair', icon: 'i-lucide-log-out', onSelect: logout },
  ],
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="platform-sidebar"
      resizable
      collapsible
      :default-size="16"
      :min-size="14"
      :max-size="22"
    >
      <template #header="{ collapsed: headerCollapsed }">
        <NuxtLink to="/platform" class="flex items-center gap-2 text-highlighted">
          <UIcon name="i-lucide-building-2" class="size-7 shrink-0 text-primary-600" />
          <span v-if="!headerCollapsed" class="text-lg font-extrabold tracking-tight">
            Pherro
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :items="links"
          :collapsed="collapsed"
          orientation="vertical"
          variant="pill"
          color="primary"
        />
      </template>

      <template #footer="{ collapsed: footerCollapsed }">
        <UDropdownMenu
          :items="userMenu"
          :content="{ align: 'end', side: 'top' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            class="w-full"
            :class="footerCollapsed ? 'justify-center' : 'justify-start'"
            :ui="{ base: 'gap-2' }"
          >
            <UAvatar alt="Plataforma" size="sm" icon="i-lucide-shield" />
            <template v-if="!footerCollapsed">
              <span class="truncate text-left">Plataforma</span>
            </template>
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
