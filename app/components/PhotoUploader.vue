<script setup lang="ts">
import type { UploadedPhoto, VehiclePhotoInput } from '~/types/vehicle'

const photos = defineModel<VehiclePhotoInput[]>({ default: () => [] })

const MAX_PHOTOS = 30
const MAX_FILE_BYTES = 10 * 1024 * 1024
const BATCH_SIZE = 10
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif'
// Server re-encodes to ≤1600px WebP anyway — shrinking client-side just saves upload time.
const CLIENT_MAX_EDGE = 2000
const CLIENT_WEBP_QUALITY = 0.85

const toast = useToast()
const uploading = ref(false)
const progress = ref<{ done: number; total: number } | null>(null)
const dragging = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

async function handleFiles(files: File[]) {
  if (!files.length || uploading.value) return

  const room = MAX_PHOTOS - photos.value.length
  if (room <= 0) {
    toast.add({ title: `Limite de ${MAX_PHOTOS} fotos por anúncio.`, color: 'error' })
    return
  }
  if (files.length > room) {
    toast.add({ title: `Só é possível adicionar mais ${room} foto(s).`, color: 'warning' })
    files = files.slice(0, room)
  }

  uploading.value = true
  progress.value = { done: 0, total: files.length }
  try {
    const prepared: Blob[] = []
    for (const file of files) {
      const blob = await compressImageForUpload(file, CLIENT_MAX_EDGE, CLIENT_WEBP_QUALITY)
      if (blob.size > MAX_FILE_BYTES) {
        toast.add({ title: `"${file.name}" excede 10 MB.`, color: 'error' })
        continue
      }
      prepared.push(blob)
    }

    for (let i = 0; i < prepared.length; i += BATCH_SIZE) {
      const batch = prepared.slice(i, i + BATCH_SIZE)
      const form = new FormData()
      batch.forEach((blob, idx) => form.append('files', blob, `photo-${i + idx}.webp`))
      const uploaded = await $fetch<UploadedPhoto[]>('/api/admin/uploads/vehicle-photos', {
        method: 'POST',
        body: form,
      })
      photos.value = [
        ...photos.value,
        ...uploaded.map(u => ({ url: u.url, thumbUrl: u.thumbUrl })),
      ]
      progress.value = { done: Math.min(i + batch.length, prepared.length), total: prepared.length }
    }
  } catch (e) {
    const msg = (e as { data?: { message?: string | string[] } })?.data?.message
    toast.add({
      title: Array.isArray(msg) ? msg.join(' ') : msg || 'Falha ao enviar as fotos.',
      color: 'error',
    })
  } finally {
    uploading.value = false
    progress.value = null
    if (inputEl.value) inputEl.value.value = ''
  }
}

function onInputChange(e: Event) {
  handleFiles(Array.from((e.target as HTMLInputElement).files ?? []))
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'))
  handleFiles(files)
}

function removePhoto(idx: number) {
  photos.value = photos.value.filter((_, i) => i !== idx)
}

function movePhoto(idx: number, delta: -1 | 1) {
  const target = idx + delta
  if (target < 0 || target >= photos.value.length) return
  const next = [...photos.value]
  const [item] = next.splice(idx, 1)
  next.splice(target, 0, item!)
  photos.value = next
}
</script>

<template>
  <div class="space-y-3">
    <button
      type="button"
      class="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition"
      :class="dragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-neutral-400'"
      :disabled="uploading"
      @click="inputEl?.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <UIcon
        :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-image-plus'"
        class="size-8 text-muted"
        :class="uploading && 'animate-spin'"
      />
      <span v-if="uploading && progress" class="text-sm text-muted">
        Enviando {{ progress.done }}/{{ progress.total }}...
      </span>
      <template v-else>
        <span class="text-sm font-medium">Arraste fotos aqui ou clique para escolher</span>
        <span class="text-xs text-muted">JPG, PNG, WebP ou AVIF · até 10 MB cada · máx. {{ MAX_PHOTOS }} fotos</span>
      </template>
    </button>
    <input
      ref="inputEl"
      type="file"
      class="hidden"
      :accept="ACCEPT"
      multiple
      @change="onInputChange"
    >

    <div v-if="photos.length" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <div
        v-for="(photo, idx) in photos"
        :key="photo.url"
        class="group relative aspect-square overflow-hidden rounded-md bg-neutral-100 ring-1 ring-neutral-200"
      >
        <img
          :src="photo.thumbUrl ?? photo.url"
          :alt="`Foto ${idx + 1}`"
          class="size-full object-cover"
          loading="lazy"
        >
        <UBadge
          v-if="idx === 0"
          label="Capa"
          size="sm"
          class="absolute left-1 top-1 bg-neutral-900/80 text-white ring-0"
        />
        <div class="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-linear-to-t from-black/60 to-transparent p-1 opacity-0 transition group-hover:opacity-100">
          <UButton
            icon="i-lucide-chevron-left"
            size="xs"
            variant="ghost"
            class="text-white"
            :disabled="idx === 0"
            aria-label="Mover para a esquerda"
            @click="movePhoto(idx, -1)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            class="text-white hover:text-red-400"
            aria-label="Remover foto"
            @click="removePhoto(idx)"
          />
          <UButton
            icon="i-lucide-chevron-right"
            size="xs"
            variant="ghost"
            class="text-white"
            :disabled="idx === photos.length - 1"
            aria-label="Mover para a direita"
            @click="movePhoto(idx, 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
