<script setup lang="ts">
import type { EmailCampaign, RecipientsPreview } from '~/types/email'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: campaign } = await useFetch<EmailCampaign>(`/api/admin/campaigns/${id}`)
const { data: recipients } = await useFetch<RecipientsPreview>('/api/admin/campaigns/recipients-preview')

useHead({ title: () => `${campaign.value?.name ?? 'Campanha'} — Pherro Admin` })

const name = ref('')
const subject = ref('')
const html = ref('')
watch(campaign, (c) => {
  if (!c) return
  name.value = c.name
  subject.value = c.subject
  html.value = c.html
}, { immediate: true })

const isDraft = computed(() => campaign.value?.status === 'DRAFT')
const dirty = computed(() =>
  !!campaign.value && (
    name.value !== campaign.value.name
    || subject.value !== campaign.value.subject
    || html.value !== campaign.value.html
  ),
)

const saving = ref(false)
async function save(): Promise<boolean> {
  saving.value = true
  try {
    campaign.value = await $fetch<EmailCampaign>(`/api/admin/campaigns/${id}`, {
      method: 'PATCH',
      body: { name: name.value, subject: subject.value, html: html.value },
    })
    toast.add({ title: 'Campanha salva', color: 'success' })
    return true
  } catch {
    toast.add({ title: 'Erro ao salvar campanha', color: 'error' })
    return false
  } finally {
    saving.value = false
  }
}

const testOpen = ref(false)
const testTo = ref('')
const testing = ref(false)
async function sendTest() {
  testing.value = true
  try {
    if (dirty.value && !(await save())) return
    await $fetch(`/api/admin/campaigns/${id}/test`, { method: 'POST', body: { to: testTo.value } })
    testOpen.value = false
    toast.add({ title: `E-mail de teste enviado para ${testTo.value}`, color: 'success' })
  } catch (e: unknown) {
    const message = (e as { data?: { message?: string } }).data?.message
    toast.add({ title: message ?? 'Erro ao enviar teste', color: 'error' })
  } finally {
    testing.value = false
  }
}

const sendOpen = ref(false)
const sending = ref(false)
async function sendCampaign() {
  sending.value = true
  try {
    if (dirty.value && !(await save())) return
    campaign.value = await $fetch<EmailCampaign>(`/api/admin/campaigns/${id}/send`, { method: 'POST' })
    sendOpen.value = false
    toast.add({
      title: 'Campanha enviada',
      description: `${campaign.value.sentCount} e-mails enviados.`,
      color: 'success',
    })
  } catch (e: unknown) {
    const message = (e as { data?: { message?: string } }).data?.message
    toast.add({ title: message ?? 'Erro ao enviar campanha', color: 'error' })
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="admin-marketing-editor">
    <template #header>
      <UDashboardNavbar :title="campaign?.name ?? 'Campanha'">
        <template #leading>
          <UButton
            to="/admin/marketing"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="Voltar"
          />
        </template>
        <template #right>
          <template v-if="isDraft">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-send"
              label="Enviar teste"
              @click="testOpen = true"
            />
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-save"
              label="Salvar"
              :loading="saving"
              :disabled="!dirty"
              @click="save"
            />
            <UButton
              color="primary"
              icon="i-lucide-rocket"
              label="Enviar campanha"
              :disabled="!recipients?.emailConfigured || !recipients?.total"
              :ui="{ base: 'text-white' }"
              @click="sendOpen = true"
            />
          </template>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="campaign" class="flex flex-col gap-4">
        <UAlert
          v-if="!isDraft"
          icon="i-lucide-info"
          color="info"
          variant="subtle"
          title="Campanha já enviada"
          :description="`${campaign.sentCount} de ${campaign.recipientCount} e-mails enviados (${campaign.failedCount} falhas). Campanhas enviadas não podem ser editadas.`"
        />
        <UAlert
          v-else-if="recipients && !recipients.emailConfigured"
          icon="i-lucide-triangle-alert"
          color="warning"
          variant="subtle"
          title="Envio de e-mails não configurado"
          description="A integração de e-mail (Resend) ainda não foi configurada pela plataforma."
        />
        <UAlert
          v-else-if="recipients"
          icon="i-lucide-users"
          color="info"
          variant="subtle"
          :title="`Destinatários: ${recipients.total} leads com e-mail`"
          :description="recipients.total === 0
            ? 'Nenhum lead com e-mail cadastrado — cadastre leads com e-mail para poder enviar.'
            : `Ex.: ${recipients.sample.map(s => s.email).join(', ')}`"
        />

        <div class="grid gap-4 lg:grid-cols-2">
          <UFormField label="Nome da campanha" required>
            <UInput v-model="name" class="w-full" :disabled="!isDraft" />
          </UFormField>
          <UFormField label="Assunto" required>
            <UInput
              v-model="subject"
              class="w-full"
              :disabled="!isDraft"
              placeholder="Ex.: {{FIRST_NAME}}, chegaram novas ofertas!"
            />
          </UFormField>
        </div>

        <UFormField label="Conteúdo (HTML)" required>
          <EmailEditor v-model="html" :variables="campaign.variables" :disabled="!isDraft" />
        </UFormField>
      </div>

      <UModal v-model:open="testOpen" title="Enviar e-mail de teste">
        <template #body>
          <div class="flex flex-col gap-4">
            <p class="text-sm text-muted">
              A campanha será enviada com valores de exemplo nas variáveis. Alterações não salvas serão salvas antes.
            </p>
            <UFormField label="Enviar para" required>
              <UInput v-model="testTo" type="email" class="w-full" placeholder="voce@exemplo.com" />
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="testOpen = false" />
            <UButton
              color="primary"
              icon="i-lucide-send"
              label="Enviar teste"
              :loading="testing"
              :disabled="!testTo"
              :ui="{ base: 'text-white' }"
              @click="sendTest"
            />
          </div>
        </template>
      </UModal>

      <UModal v-model:open="sendOpen" title="Enviar campanha">
        <template #body>
          <p class="text-sm text-muted">
            A campanha <strong class="text-highlighted">{{ name }}</strong> será enviada para
            <strong class="text-highlighted">{{ recipients?.total ?? 0 }} leads</strong> com e-mail cadastrado.
            Esta ação não pode ser desfeita.
          </p>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" label="Cancelar" @click="sendOpen = false" />
            <UButton
              color="primary"
              icon="i-lucide-rocket"
              label="Confirmar envio"
              :loading="sending"
              :ui="{ base: 'text-white' }"
              @click="sendCampaign"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
