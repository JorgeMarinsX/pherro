<script setup lang="ts">
import { renderPreview, type EmailVariable } from '~/types/email'

// Mailchimp-style HTML editor: code pane + live preview, variable chips insert
// `{{TAG}}` at the cursor. Native textarea — Nuxt UI has no code editor.
const props = defineProps<{
  variables: EmailVariable[]
  disabled?: boolean
}>()

const html = defineModel<string>({ required: true })

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const view = ref<'split' | 'code' | 'preview'>('split')

const viewOptions = [
  { value: 'split', icon: 'i-lucide-columns-2', label: 'Dividido' },
  { value: 'code', icon: 'i-lucide-code', label: 'Código' },
  { value: 'preview', icon: 'i-lucide-eye', label: 'Prévia' },
]

const preview = computed(() => renderPreview(html.value, props.variables))

function insertVariable(key: string) {
  if (props.disabled) return
  const tag = `{{${key}}}`
  const el = textareaRef.value
  if (!el) {
    html.value += tag
    return
  }
  const start = el.selectionStart ?? html.value.length
  const end = el.selectionEnd ?? start
  html.value = html.value.slice(0, start) + tag + html.value.slice(end)
  nextTick(() => {
    el.focus()
    el.selectionStart = el.selectionEnd = start + tag.length
  })
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-medium text-muted mr-1">Variáveis:</span>
        <UTooltip v-for="v in variables" :key="v.key" :text="`${v.label} — ex.: ${v.sample}`">
          <UButton
            size="xs"
            color="neutral"
            variant="soft"
            :disabled="disabled"
            :label="`{{${v.key}}}`"
            class="font-mono"
            @click="insertVariable(v.key)"
          />
        </UTooltip>
      </div>

      <UTabs
        v-model="view"
        :items="viewOptions"
        :content="false"
        size="xs"
        :ui="{ trigger: 'gap-1' }"
      />
    </div>

    <div class="grid gap-3" :class="view === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'">
      <textarea
        v-show="view !== 'preview'"
        ref="textareaRef"
        v-model="html"
        :disabled="disabled"
        spellcheck="false"
        class="min-h-[420px] w-full resize-y rounded-lg border border-default bg-elevated/50 p-3 font-mono text-xs leading-relaxed text-highlighted focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
        placeholder="<p>Olá, {{FIRST_NAME}}!</p>"
      />

      <div
        v-show="view !== 'code'"
        class="min-h-[420px] overflow-hidden rounded-lg border border-default bg-white"
      >
        <iframe
          title="Prévia do e-mail"
          sandbox=""
          :srcdoc="preview"
          class="h-full min-h-[420px] w-full"
        />
      </div>
    </div>
  </div>
</template>
