<script setup lang="ts">
import type { EmailTemplate } from '~/types/email'

definePageMeta({
  layout: 'platform',
  middleware: 'platform',
})

const route = useRoute()
const key = route.params.key as string
const toast = useToast()

const { data: template } = await useFetch<EmailTemplate>(
  `/api/platform/email-templates/${encodeURIComponent(key)}`,
)

useHead({ title: () => `${template.value?.name ?? 'Modelo'} — Pherro Plataforma` })

const subject = ref('')
const html = ref('')
const isActive = ref(true)
watch(template, (t) => {
  if (!t) return
  subject.value = t.subject
  html.value = t.html
  isActive.value = t.isActive
}, { immediate: true })

const dirty = computed(() =>
  !!template.value && (
    subject.value !== template.value.subject
    || html.value !== template.value.html
    || isActive.value !== template.value.isActive
  ),
)

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    const updated = await $fetch<EmailTemplate>(`/api/platform/email-templates/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: { subject: subject.value, html: html.value, isActive: isActive.value },
    })
    template.value = updated
    toast.add({ title: 'Modelo salvo', color: 'success' })
  } catch {
    toast.add({ title: 'Erro ao salvar modelo', color: 'error' })
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
    await $fetch(`/api/platform/email-templates/${encodeURIComponent(key)}/test`, {
      method: 'POST',
      body: { to: testTo.value },
    })
    testOpen.value = false
    toast.add({ title: `E-mail de teste enviado para ${testTo.value}`, color: 'success' })
  } catch (e: unknown) {
    const message = (e as { data?: { message?: string } }).data?.message
    toast.add({ title: message ?? 'Erro ao enviar teste', color: 'error' })
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="platform-email-editor">
    <template #header>
      <UDashboardNavbar :title="template?.name ?? 'Modelo'">
        <template #leading>
          <UButton
            to="/platform/emails"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="Voltar"
          />
        </template>
        <template #right>
          <USwitch v-model="isActive" label="Ativo" />
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-send"
            label="Enviar teste"
            @click="testOpen = true"
          />
          <UButton
            color="primary"
            icon="i-lucide-save"
            label="Salvar"
            :loading="saving"
            :disabled="!dirty"
            :ui="{ base: 'text-white' }"
            @click="save"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="template" class="flex flex-col gap-4">
        <p class="text-sm text-muted">{{ template.description }}</p>

        <UFormField label="Assunto" required>
          <UInput v-model="subject" class="w-full" placeholder="Assunto do e-mail" />
        </UFormField>

        <UFormField label="Conteúdo (HTML)" required>
          <EmailEditor v-model="html" :variables="template.variables" />
        </UFormField>
      </div>

      <UModal v-model:open="testOpen" title="Enviar e-mail de teste">
        <template #body>
          <div class="flex flex-col gap-4">
            <p class="text-sm text-muted">
              O modelo será enviado com valores de exemplo nas variáveis.
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
    </template>
  </UDashboardPanel>
</template>
