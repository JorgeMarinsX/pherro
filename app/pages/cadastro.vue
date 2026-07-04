<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'Criar minha loja — Pherro',
  description: 'Crie a loja online da sua revenda de veículos em minutos. Grátis para começar.',
})

const config = useRuntimeConfig()
const url = useRequestURL()
const toast = useToast()

const state = reactive({
  name: '',
  slug: '',
  adminEmail: '',
  adminPassword: '',
  passwordConfirm: '',
})

// Suggest slug from name until the user types their own (mirrors TenantFormModal).
const slugTouched = ref(false)
watch(() => state.name, (name: string) => {
  if (slugTouched.value) return
  state.slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

const siteHost = computed(() =>
  state.slug ? `${state.slug}.${config.public.appBaseDomain}` : `sualoja.${config.public.appBaseDomain}`,
)

function validate(s: typeof state) {
  const errors: { name: string; message: string }[] = []
  if (s.name.trim().length < 2) errors.push({ name: 'name', message: 'Informe o nome da loja.' })
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s.slug) || s.slug.length < 3 || s.slug.length > 63) {
    errors.push({ name: 'slug', message: 'Use de 3 a 63 caracteres: letras minúsculas, números e hífens.' })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.adminEmail)) {
    errors.push({ name: 'adminEmail', message: 'Informe um e-mail válido.' })
  }
  if (s.adminPassword.length < 8) {
    errors.push({ name: 'adminPassword', message: 'A senha precisa de pelo menos 8 caracteres.' })
  }
  if (s.passwordConfirm !== s.adminPassword) {
    errors.push({ name: 'passwordConfirm', message: 'As senhas não conferem.' })
  }
  return errors
}

const submitting = ref(false)
const created = ref<{ slug: string } | null>(null)

// New tenant lives on its own host — build links off the current origin (keeps dev port).
const port = url.port ? `:${url.port}` : ''
const createdSiteUrl = computed(() =>
  created.value ? `${url.protocol}//${created.value.slug}.${config.public.appBaseDomain}${port}` : '',
)
const createdAdminUrl = computed(() => (created.value ? `${createdSiteUrl.value}/admin/login` : ''))

async function onSubmit() {
  submitting.value = true
  try {
    const tenant = await $fetch<{ slug: string }>('/api/platform/signup', {
      method: 'POST',
      body: {
        name: state.name.trim(),
        slug: state.slug,
        adminEmail: state.adminEmail,
        adminPassword: state.adminPassword,
      },
    })
    created.value = { slug: tenant.slug }
  } catch (err: unknown) {
    const message =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Não foi possível criar sua loja. Tente novamente.'
    toast.add({ title: 'Erro no cadastro', description: message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UContainer class="py-14 sm:py-20">
    <!-- Success -->
    <div v-if="created" class="mx-auto max-w-lg text-center">
      <div class="mx-auto w-fit rounded-full bg-primary-100 p-4">
        <UIcon name="i-lucide-party-popper" class="size-10 text-primary-600" />
      </div>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight text-neutral-900">
        Sua loja está no ar!
      </h1>
      <p class="mt-3 text-neutral-600">
        Acesse o painel administrativo com o e-mail e a senha que você cadastrou
        e publique seu primeiro veículo.
      </p>
      <div class="mt-8 space-y-3">
        <UButton
          :to="createdAdminUrl"
          external
          color="primary"
          size="xl"
          block
          icon="i-lucide-layout-dashboard"
          label="Acessar painel administrativo"
        />
        <UButton
          :to="createdSiteUrl"
          external
          color="neutral"
          variant="outline"
          size="xl"
          block
          icon="i-lucide-globe"
          :label="`Ver minha loja (${created.slug}.${config.public.appBaseDomain})`"
        />
      </div>
    </div>

    <!-- Form -->
    <div v-else class="mx-auto max-w-lg">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-extrabold tracking-tight text-neutral-900">
          Criar minha loja
        </h1>
        <p class="mt-2 text-sm text-neutral-600">
          Grátis para começar. Sua loja no ar em
          <span class="font-mono text-neutral-900">{{ siteHost }}</span>
        </p>
      </div>

      <UCard>
        <UForm :state="state" :validate="validate" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nome da loja" name="name" required>
            <UInput
              v-model="state.name"
              placeholder="Ex.: AutoCenter Silva"
              icon="i-lucide-store"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Endereço da loja"
            name="slug"
            required
            :help="`Site: ${siteHost}`"
          >
            <UInput
              v-model="state.slug"
              placeholder="autocenter-silva"
              icon="i-lucide-globe"
              size="lg"
              class="w-full"
              @input="slugTouched = true"
            />
          </UFormField>

          <UFormField label="Seu e-mail" name="adminEmail" required help="Será o acesso de administrador da loja.">
            <UInput
              v-model="state.adminEmail"
              type="email"
              autocomplete="email"
              placeholder="voce@sualoja.com"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Senha" name="adminPassword" required help="Mínimo de 8 caracteres.">
            <UInput
              v-model="state.adminPassword"
              type="password"
              autocomplete="new-password"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Confirmar senha" name="passwordConfirm" required>
            <UInput
              v-model="state.passwordConfirm"
              type="password"
              autocomplete="new-password"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            size="xl"
            block
            :loading="submitting"
            icon="i-lucide-rocket"
            label="Criar minha loja"
            :ui="{ base: 'font-semibold' }"
          />
        </UForm>
      </UCard>

      <p class="mt-6 text-center text-xs text-neutral-500">
        Já tem uma loja? Acesse o painel pelo endereço dela
        (ex.: <span class="font-mono">{{ siteHost }}/admin</span>).
      </p>
    </div>
  </UContainer>
</template>
