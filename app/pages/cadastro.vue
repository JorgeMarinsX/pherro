<script setup lang="ts">
import { PLANS, formatBrl, isPaidPlan } from '~~/shared/plans'

definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'Criar minha loja — Pherro',
  description: 'Crie a loja online da sua revenda de veículos em minutos. Escolha seu plano e comece a vender.',
})

const config = useRuntimeConfig()
const url = useRequestURL()
const route = useRoute()
const toast = useToast()

// A plan must be chosen on the landing page (?plan=inicio|profissional|rede). There is no
// free tier — without a valid plan there is nothing to sign up for, so bounce to pricing.
const planId = computed(() => {
  const p = typeof route.query.plan === 'string' ? route.query.plan : ''
  return isPaidPlan(p) ? p : ''
})
const selectedPlan = computed(() => (planId.value ? PLANS[planId.value]! : null))

if (!planId.value) {
  await navigateTo('/#planos')
}

const state = reactive({
  name: '',
  slug: '',
  adminEmail: '',
  cpfCnpj: '',
  adminPassword: '',
  passwordConfirm: '',
})

const cpfCnpjDigits = computed(() => state.cpfCnpj.replace(/\D/g, ''))

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
  const cpfDigits = s.cpfCnpj.replace(/\D/g, '')
  if (!cpfDigits) {
    errors.push({ name: 'cpfCnpj', message: 'CPF ou CNPJ é obrigatório para assinar o plano.' })
  } else if (!/^\d{11}$|^\d{14}$/.test(cpfDigits)) {
    errors.push({ name: 'cpfCnpj', message: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.' })
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
const created = ref<{ slug: string; invoiceUrl: string | null } | null>(null)

// New tenant lives on its own host — build links off the current origin (keeps dev port).
const port = url.port ? `:${url.port}` : ''
const createdSiteUrl = computed(() =>
  created.value ? `${url.protocol}//${created.value.slug}.${config.public.appBaseDomain}${port}` : '',
)
const createdAdminUrl = computed(() => (created.value ? `${createdSiteUrl.value}/admin/login` : ''))
// Fallback when the invoice link wasn't returned (billing not yet configured): send the
// owner to the plan page, which retries the subscription (guarded → login → checkout).
const createdCheckoutUrl = computed(() =>
  created.value && planId.value
    ? `${createdSiteUrl.value}/admin/login?redirect=${encodeURIComponent(`/admin/plano?plan=${planId.value}`)}`
    : '',
)

async function onSubmit() {
  submitting.value = true
  try {
    const tenant = await $fetch<{ slug: string; invoiceUrl: string | null }>('/api/platform/signup', {
      method: 'POST',
      body: {
        name: state.name.trim(),
        slug: state.slug,
        adminEmail: state.adminEmail,
        adminPassword: state.adminPassword,
        cpfCnpj: cpfCnpjDigits.value,
        plan: planId.value,
      },
    })
    created.value = { slug: tenant.slug, invoiceUrl: tenant.invoiceUrl }
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
        Conta criada! Falta o pagamento.
      </h1>
      <p class="mt-3 text-neutral-600">
        Sua loja <strong>{{ selectedPlan?.label }}</strong> fica ativa assim que o primeiro
        pagamento for confirmado. Escolha como pagar (Pix, boleto ou cartão).
      </p>
      <div class="mt-8 space-y-3">
        <UButton
          v-if="created.invoiceUrl"
          :to="created.invoiceUrl"
          external
          target="_blank"
          color="primary"
          size="xl"
          block
          icon="i-lucide-credit-card"
          label="Pagar agora"
        />
        <UButton
          v-else
          :to="createdCheckoutUrl"
          external
          color="primary"
          size="xl"
          block
          icon="i-lucide-credit-card"
          label="Ir para o pagamento"
        />
        <UButton
          :to="createdAdminUrl"
          external
          color="neutral"
          variant="outline"
          size="xl"
          block
          icon="i-lucide-layout-dashboard"
          label="Acessar painel administrativo"
        />
      </div>
      <p class="mt-6 text-xs text-neutral-500">
        Após o pagamento sua loja fica no ar em
        <span class="font-mono">{{ created.slug }}.{{ config.public.appBaseDomain }}</span>.
      </p>
    </div>

    <!-- Form -->
    <div v-else class="mx-auto max-w-lg">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-extrabold tracking-tight text-neutral-900">
          Criar minha loja
        </h1>
        <p class="mt-2 text-sm text-neutral-600">
          Sua loja no ar em
          <span class="font-mono text-neutral-900">{{ siteHost }}</span>
        </p>
      </div>

      <div
        v-if="selectedPlan"
        class="mb-6 flex items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3"
      >
        <div class="flex items-center gap-2 text-sm text-neutral-700">
          <UIcon name="i-lucide-badge-check" class="size-5 shrink-0 text-primary-600" />
          <span>
            Plano <strong>{{ selectedPlan.label }}</strong> —
            {{ formatBrl(selectedPlan.monthlyCents) }}/mês. Pagamento após criar a conta.
          </span>
        </div>
        <NuxtLink to="/#planos" class="shrink-0 text-xs text-primary-600 hover:underline">
          trocar
        </NuxtLink>
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

          <UFormField
            label="CPF ou CNPJ"
            name="cpfCnpj"
            required
            help="Necessário para emitir a cobrança do plano."
          >
            <UInput
              v-model="state.cpfCnpj"
              inputmode="numeric"
              placeholder="000.000.000-00"
              icon="i-lucide-id-card"
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
