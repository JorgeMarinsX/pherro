<script setup lang="ts">
import type { EmailCampaign, CampaignStatus } from '~/types/email'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'E-mail marketing — Pherro Admin' })

const toast = useToast()

const { data, pending, refresh } = await useFetch<{ items: EmailCampaign[], emailConfigured: boolean }>(
  '/api/admin/campaigns',
)

const statusMeta: Record<CampaignStatus, { label: string, color: 'neutral' | 'warning' | 'success' | 'error' }> = {
  DRAFT: { label: 'Rascunho', color: 'neutral' },
  SENDING: { label: 'Enviando', color: 'warning' },
  SENT: { label: 'Enviada', color: 'success' },
  FAILED: { label: 'Falhou', color: 'error' },
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const createOpen = ref(false)
const newName = ref('')
const creating = ref(false)
async function createCampaign() {
  creating.value = true
  try {
    const campaign = await $fetch<EmailCampaign>('/api/admin/campaigns', {
      method: 'POST',
      body: { name: newName.value },
    })
    createOpen.value = false
    newName.value = ''
    await navigateTo(`/admin/marketing/${campaign.id}`)
  } catch {
    toast.add({ title: 'Erro ao criar campanha', color: 'error' })
  } finally {
    creating.value = false
  }
}

async function removeCampaign(c: EmailCampaign) {
  try {
    await $fetch(`/api/admin/campaigns/${c.id}`, { method: 'DELETE' })
    toast.add({ title: 'Campanha excluída', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erro ao excluir campanha', color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="admin-marketing">
    <template #header>
      <UDashboardNavbar title="E-mail marketing">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Nova campanha"
            :ui="{ base: 'text-white' }"
            @click="createOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="data && !data.emailConfigured"
        icon="i-lucide-triangle-alert"
        color="warning"
        variant="subtle"
        title="Envio de e-mails não configurado"
        description="A plataforma ainda não configurou a integração de e-mail. Você pode criar e editar campanhas, mas o envio ficará indisponível."
        class="mb-4"
      />

      <div v-if="pending" class="flex flex-col gap-3">
        <USkeleton v-for="i in 3" :key="i" class="h-16" />
      </div>

      <UCard v-else-if="!data?.items.length" :ui="{ root: 'border-2 border-dashed border-default bg-elevated/30' }">
        <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="rounded-full bg-primary-500/15 p-4">
            <UIcon name="i-lucide-mail-plus" class="size-10 text-primary-400" />
          </div>
          <p class="mt-5 text-lg font-semibold text-highlighted">Nenhuma campanha criada</p>
          <p class="mt-1 text-sm text-muted">
            Crie uma campanha para enviar e-mails aos seus leads com e-mail cadastrado.
          </p>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="Nova campanha"
            class="mt-5"
            :ui="{ base: 'text-white' }"
            @click="createOpen = true"
          />
        </div>
      </UCard>

      <div v-else class="flex flex-col gap-3">
        <UCard v-for="c in data.items" :key="c.id" :ui="{ body: 'py-4' }">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <NuxtLink
                  :to="`/admin/marketing/${c.id}`"
                  class="truncate font-semibold text-highlighted hover:text-primary-600"
                >
                  {{ c.name }}
                </NuxtLink>
                <UBadge
                  :color="statusMeta[c.status].color"
                  variant="subtle"
                  :label="statusMeta[c.status].label"
                />
              </div>
              <p class="mt-1 truncate text-sm text-muted">
                {{ c.subject || 'Sem assunto' }}
              </p>
              <p class="mt-1 text-xs text-dimmed">
                <template v-if="c.status === 'SENT' || c.status === 'FAILED'">
                  {{ c.sentCount }} enviados · {{ c.failedCount }} falhas ·
                  {{ c.sentAt ? dateFmt.format(new Date(c.sentAt)) : '' }}
                </template>
                <template v-else>
                  Criada em {{ dateFmt.format(new Date(c.createdAt)) }}
                </template>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                :to="`/admin/marketing/${c.id}`"
                color="neutral"
                variant="outline"
                :icon="c.status === 'DRAFT' ? 'i-lucide-pencil' : 'i-lucide-eye'"
                :label="c.status === 'DRAFT' ? 'Editar' : 'Ver'"
              />
              <UButton
                v-if="c.status !== 'SENDING'"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                aria-label="Excluir campanha"
                @click="removeCampaign(c)"
              />
            </div>
          </div>
        </UCard>
      </div>

      <UModal v-model:open="createOpen" title="Nova campanha">
        <template #body>
          <UFormField label="Nome da campanha" required help="Uso interno — o lead não vê este nome.">
            <UInput
              v-model="newName"
              class="w-full"
              placeholder="Ex.: Ofertas de julho"
              @keyup.enter="newName.length >= 2 && createCampaign()"
            />
          </UFormField>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="createOpen = false" />
            <UButton
              color="primary"
              label="Criar campanha"
              :loading="creating"
              :disabled="newName.length < 2"
              :ui="{ base: 'text-white' }"
              @click="createCampaign"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
