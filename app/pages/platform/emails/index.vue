<script setup lang="ts">
import type { EmailTemplate } from '~/types/email'

definePageMeta({
  layout: 'platform',
  middleware: 'platform',
})

useHead({ title: 'E-mails transacionais — Pherro Plataforma' })

const { data: templates, pending } = await useFetch<EmailTemplate[]>('/api/platform/email-templates')

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
</script>

<template>
  <UDashboardPanel id="platform-emails">
    <template #header>
      <UDashboardNavbar title="E-mails transacionais">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p class="mb-4 text-sm text-muted">
        Modelos enviados automaticamente pela plataforma. Edite o conteúdo e use as variáveis para personalizar.
      </p>

      <div v-if="pending" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <USkeleton v-for="i in 3" :key="i" class="h-40" />
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="t in templates"
          :key="t.key"
          class="flex flex-col"
          :ui="{ body: 'flex-1' }"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="size-5 text-primary-400" />
              <span class="font-semibold text-highlighted">{{ t.name }}</span>
            </div>
            <UBadge
              :color="t.isActive ? 'success' : 'neutral'"
              variant="subtle"
              :label="t.isActive ? 'Ativo' : 'Inativo'"
            />
          </div>
          <p class="mt-2 text-sm text-muted">{{ t.description }}</p>
          <p class="mt-3 truncate text-xs text-dimmed">
            Assunto: <span class="text-muted">{{ t.subject }}</span>
          </p>
          <p class="mt-1 text-xs text-dimmed">
            Atualizado em {{ dateFmt.format(new Date(t.updatedAt)) }}
          </p>

          <template #footer>
            <UButton
              :to="`/platform/emails/${t.key}`"
              color="primary"
              variant="soft"
              icon="i-lucide-pencil"
              label="Editar modelo"
              block
            />
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
