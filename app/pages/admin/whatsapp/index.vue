<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'WhatsApp — Pherro Admin' })

import type { VehicleWhatsapp } from '~/types/vehicle'
import type { DropdownMenuItem } from '@nuxt/ui'

const { list, activate, remove } = useAdminWhatsapp()
const toast = useToast()

const { data: numbers, refresh } = list()

const formOpen = ref(false)
// null = create mode; set = edit that number.
const editing = ref<VehicleWhatsapp | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(n: VehicleWhatsapp) {
  editing.value = n
  formOpen.value = true
}

async function onActivate(n: VehicleWhatsapp) {
  try {
    await activate(n.id)
    toast.add({ title: `"${n.label}" definido como ativo`, color: 'success' })
    await refresh()
  } catch (err: unknown) {
    toast.add({ title: 'Erro', description: messageOf(err), color: 'error' })
  }
}

async function onRemove(n: VehicleWhatsapp) {
  try {
    await remove(n.id)
    toast.add({ title: 'Número removido', color: 'success' })
    await refresh()
  } catch (err: unknown) {
    toast.add({ title: 'Erro', description: messageOf(err), color: 'error' })
  }
}

function messageOf(err: unknown): string {
  return String(
    (err as { data?: { message?: string } }).data?.message
      ?? 'Operação não concluída.',
  )
}

function menuItems(n: VehicleWhatsapp): DropdownMenuItem[][] {
  const group: DropdownMenuItem[] = [
    { label: 'Editar', icon: 'i-lucide-pencil', onSelect: () => openEdit(n) },
  ]
  if (!n.isActive) {
    group.push({
      label: 'Definir como ativo',
      icon: 'i-lucide-check-circle',
      onSelect: () => onActivate(n),
    })
  }
  return [
    group,
    [
      {
        label: 'Remover',
        icon: 'i-lucide-trash-2',
        color: 'error',
        // Active number can't be removed — guide the admin instead of failing silently.
        onSelect: () =>
          n.isActive
            ? toast.add({
                title: 'Não é possível remover',
                description: 'Defina outro número como ativo antes de remover.',
                color: 'error',
              })
            : onRemove(n),
      },
    ],
  ]
}
</script>

<template>
  <UDashboardPanel id="admin-whatsapp">
    <template #header>
      <UDashboardNavbar title="Números WhatsApp">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="primary" icon="i-lucide-plus" label="Novo número" :ui="{ base: 'text-white' }" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard v-if="!numbers || numbers.length === 0" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-message-circle" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhum número cadastrado</p>
          <p class="mt-1 text-sm text-muted">
            Adicione números para que clientes possam contatar a loja.
          </p>
          <UButton color="primary" icon="i-lucide-plus" label="Novo número" class="mt-5" :ui="{ base: 'text-white' }" @click="openCreate" />
        </div>
      </UCard>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <UCard v-for="n in numbers" :key="n.id">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate font-semibold text-highlighted">{{ n.label }}</p>
                <UBadge
                  v-if="n.isActive"
                  color="primary"
                  variant="subtle"
                  size="sm"
                  icon="i-lucide-check-circle"
                  label="Ativo"
                />
              </div>
              <p class="mt-1 text-sm text-muted">{{ n.number }}</p>
              <p v-if="n.description" class="mt-1 text-sm text-dimmed">{{ n.description }}</p>
            </div>
            <UDropdownMenu :items="menuItems(n)">
              <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" />
            </UDropdownMenu>
          </div>
        </UCard>
      </div>

      <NumeroFormModal v-model:open="formOpen" :number="editing" @submitted="refresh" />
    </template>
  </UDashboardPanel>
</template>
