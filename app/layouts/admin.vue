<script setup lang="ts">
// TODO: load shopName + logoUrl from ShopConfig via API once endpoint exists.
const shopName = 'Pherro'

// TODO: load current user from Supabase Auth session.
const currentUser = {
  name: 'Administrador',
  email: 'admin@pherro.local',
}

const links = ref([
  [
    { label: 'Painel', icon: 'i-lucide-layout-dashboard', to: '/admin' },
    { label: 'Anúncios', icon: 'i-lucide-car-front', to: '/admin/anuncios' },
    { label: 'Leads', icon: 'i-lucide-users', to: '/admin/leads' },
    { label: 'Atributos', icon: 'i-lucide-sliders-horizontal', to: '/admin/atributos' },
    { label: 'WhatsApp', icon: 'i-lucide-message-circle', to: '/admin/whatsapp' },
  ],
  [
    { label: 'Configurações', icon: 'i-lucide-settings', to: '/admin/configuracoes' },
    { label: 'Ver site', icon: 'i-lucide-external-link', to: '/', target: '_blank' },
  ],
])

const userMenu = ref([
  [
    { label: currentUser.email, type: 'label' as const },
  ],
  [
    { label: 'Configurações', icon: 'i-lucide-settings', to: '/admin/configuracoes' },
  ],
  [
    { label: 'Sair', icon: 'i-lucide-log-out', to: '/admin/logout' },
  ],
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="admin-sidebar"
      resizable
      collapsible
      :default-size="16"
      :min-size="14"
      :max-size="22"
    >
      <template #header="{ collapsed: headerCollapsed }">
        <NuxtLink to="/admin" class="flex items-center gap-2 text-highlighted">
          <UIcon name="i-lucide-car-front" class="size-7 shrink-0 text-primary-600" />
          <span v-if="!headerCollapsed" class="text-lg font-extrabold tracking-tight">
            {{ shopName }}
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
            <UAvatar
              :alt="currentUser.name"
              size="sm"
              icon="i-lucide-user"
            />
            <template v-if="!footerCollapsed">
              <span class="truncate text-left">{{ currentUser.name }}</span>
            </template>
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
