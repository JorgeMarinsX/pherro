<script setup lang="ts">
import type { BrandingKind } from '~/types/shop-config'

// Single branding image (logo/hero/favicon). Upload persists immediately —
// the backend swaps the ShopConfig URL and deletes the replaced file.
const url = defineModel<string | null>({ default: null })

const props = defineProps<{
  kind: BrandingKind
  hint?: string
}>()

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif'
const CLIENT_MAX_EDGE = 2000
const CLIENT_WEBP_QUALITY = 0.85

const toast = useToast()
const busy = ref(false)
const dragging = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

const previewClass = computed(() =>
  props.kind === 'hero' ? 'aspect-video w-full max-w-md' : 'size-24',
)

function errorMessage(e: unknown, fallback: string): string {
  const msg = (e as { data?: { message?: string | string[] } })?.data?.message
  return Array.isArray(msg) ? msg.join(' ') : msg || fallback
}

async function handleFile(file: File | undefined) {
  if (!file || busy.value) return
  busy.value = true
  try {
    const blob = await compressImageForUpload(file, CLIENT_MAX_EDGE, CLIENT_WEBP_QUALITY)
    if (blob.size > MAX_FILE_BYTES) {
      toast.add({ title: 'A imagem excede 10 MB.', color: 'error' })
      return
    }
    const form = new FormData()
    form.append('file', blob, `${props.kind}.webp`)
    const res = await $fetch<{ url: string }>(`/api/admin/uploads/branding/${props.kind}`, {
      method: 'POST',
      body: form,
    })
    url.value = res.url
    toast.add({ title: 'Imagem atualizada', color: 'success' })
  } catch (e) {
    toast.add({ title: errorMessage(e, 'Falha ao enviar a imagem.'), color: 'error' })
  } finally {
    busy.value = false
    if (inputEl.value) inputEl.value.value = ''
  }
}

async function remove() {
  if (busy.value) return
  busy.value = true
  try {
    await $fetch(`/api/admin/uploads/branding/${props.kind}`, { method: 'DELETE' })
    url.value = null
    toast.add({ title: 'Imagem removida', color: 'success' })
  } catch (e) {
    toast.add({ title: errorMessage(e, 'Falha ao remover a imagem.'), color: 'error' })
  } finally {
    busy.value = false
  }
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = Array.from(e.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'))
  handleFile(file)
}
</script>

<template>
  <div class="flex flex-wrap items-start gap-3">
    <div
      v-if="url"
      class="relative shrink-0 overflow-hidden rounded-md bg-neutral-100 ring-1 ring-neutral-200"
      :class="previewClass"
    >
      <img :src="url" alt="" class="size-full object-contain">
    </div>

    <button
      type="button"
      class="flex min-h-24 flex-1 basis-48 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center transition"
      :class="dragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-neutral-400'"
      :disabled="busy"
      @click="inputEl?.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <UIcon
        :name="busy ? 'i-lucide-loader-circle' : 'i-lucide-image-plus'"
        class="size-6 text-muted"
        :class="busy && 'animate-spin'"
      />
      <span class="text-sm font-medium">
        {{ busy ? 'Enviando...' : url ? 'Trocar imagem' : 'Enviar imagem' }}
      </span>
      <span v-if="hint" class="text-xs text-muted">{{ hint }}</span>
    </button>

    <UButton
      v-if="url"
      icon="i-lucide-trash-2"
      color="error"
      variant="ghost"
      label="Remover"
      :disabled="busy"
      @click="remove"
    />

    <input
      ref="inputEl"
      type="file"
      class="hidden"
      :accept="ACCEPT"
      @change="handleFile(($event.target as HTMLInputElement).files?.[0])"
    >
  </div>
</template>
