<script setup lang="ts">
// Platform chrome is always dark (amber-on-black). Force dark mode while here,
// restore the user's preference on leave so tenant admin is unaffected.
const colorMode = useColorMode()
const prevMode = colorMode.preference
colorMode.preference = 'dark'
onBeforeUnmount(() => { colorMode.preference = prevMode })

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
    { label: 'E-mails transacionais', icon: 'i-lucide-mail', to: '/platform/emails' },
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
  <UDashboardGroup unit="rem" class="theme-platform bg-zinc-950 text-white">
    <UDashboardSidebar
      id="platform-sidebar"
      resizable
      collapsible
      :default-size="16"
      :min-size="14"
      :max-size="22"
      :ui="{ root: 'bg-zinc-900/60 border-r border-zinc-800', header: 'border-zinc-800', footer: 'border-zinc-800' }"
    >
      <template #header="{ collapsed: headerCollapsed }">
        <NuxtLink to="/platform" class="flex items-center gap-2 text-white">
          <UIcon name="i-lucide-building-2" class="size-7 shrink-0 text-primary-400" />
          <span v-if="!headerCollapsed" class="text-lg font-extrabold tracking-tight">
            Plataforma
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
