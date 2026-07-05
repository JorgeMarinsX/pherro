<script setup lang="ts">
import { PLANS, PAID_PLAN_IDS, formatBrl } from '~~/shared/plans'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({ title: 'Plano — Pherro Admin' })

const route = useRoute()
const toast = useToast()

interface BillingStatus {
  plan: string
  status: 'ACTIVE' | 'PENDING_PAYMENT' | 'SUSPENDED'
  hasDocument: boolean
  billingConfigured: boolean
  subscription: { status: string; invoiceUrl: string | null } | null
}

const { data: status, refresh, pending } = await useFetch<BillingStatus>('/api/admin/billing/status', {
  key: 'admin-billing-status',
})

const currentPlan = computed(() => (status.value ? PLANS[status.value.plan] ?? null : null))
const isPending = computed(() => status.value?.status === 'PENDING_PAYMENT')
const paidPlans = PAID_PLAN_IDS.map((id) => PLANS[id]!)
const invoiceUrl = computed(() => status.value?.subscription?.invoiceUrl ?? null)

const subscribing = ref<string | null>(null)

async function subscribe(planId: string) {
  subscribing.value = planId
  try {
    const res = await $fetch<{ plan: string; invoiceUrl: string | null }>('/api/admin/billing/subscribe', {
      method: 'POST',
      body: { planId },
    })
    await refresh()
    if (res.invoiceUrl) {
      // Send the customer to the hosted invoice to pick Pix/boleto/card and pay.
      window.open(res.invoiceUrl, '_blank', 'noopener')
      toast.add({ title: 'Assinatura criada', description: 'Abrimos a página de pagamento em uma nova aba.', color: 'success' })
    } else {
      toast.add({ title: 'Assinatura criada', description: 'Aguardando geração da cobrança.', color: 'success' })
    }
  } catch (err: unknown) {
    const message =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Não foi possível assinar o plano. Tente novamente.'
    toast.add({ title: 'Erro', description: message, color: 'error' })
  } finally {
    subscribing.value = null
  }
}

const cancelling = ref(false)
async function cancel() {
  cancelling.value = true
  try {
    await $fetch('/api/admin/billing/subscription', { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Assinatura cancelada', description: 'Sua loja voltou ao plano Grátis.', color: 'success' })
  } catch (err: unknown) {
    const message =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Não foi possível cancelar a assinatura.'
    toast.add({ title: 'Erro', description: message, color: 'error' })
  } finally {
    cancelling.value = false
  }
}

// Arrived from signup checkout (?plan=X): auto-start subscription if not already on it.
onMounted(() => {
  const p = typeof route.query.plan === 'string' ? route.query.plan : ''
  if (
    p &&
    PAID_PLAN_IDS.includes(p as (typeof PAID_PLAN_IDS)[number]) &&
    status.value?.billingConfigured &&
    status.value?.plan !== p
  ) {
    subscribe(p)
  }
})
</script>

<template>
  <UDashboardPanel id="admin-plano">
    <template #header>
      <UDashboardNavbar title="Plano e cobrança">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Awaiting first payment: store stays offline until confirmed -->
        <UAlert
          v-if="isPending"
          color="warning"
          variant="subtle"
          icon="i-lucide-clock"
          title="Pagamento pendente"
          description="Sua loja fica offline até o primeiro pagamento ser confirmado. Assine abaixo e pague por Pix, boleto ou cartão."
        />

        <!-- Billing unavailable (no Asaas key configured) -->
        <UAlert
          v-if="status && !status.billingConfigured"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Pagamentos indisponíveis"
          description="A cobrança automática ainda não está ativa nesta instância. Tente novamente mais tarde."
        />

        <!-- Current plan summary -->
        <UCard>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-muted">Plano atual</p>
              <p class="mt-1 text-2xl font-bold text-highlighted">
                {{ currentPlan?.label ?? '—' }}
                <span v-if="currentPlan && currentPlan.monthlyCents > 0" class="text-base font-medium text-muted">
                  · {{ formatBrl(currentPlan.monthlyCents) }}/mês
                </span>
              </p>
              <p
                v-if="status?.subscription"
                class="mt-1 text-sm text-muted"
              >
                Assinatura: {{ status.subscription.status }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-if="invoiceUrl"
                :to="invoiceUrl"
                target="_blank"
                external
                color="primary"
                icon="i-lucide-external-link"
                label="Pagar cobrança"
              />
              <UButton
                v-if="status && status.plan !== 'free'"
                color="neutral"
                variant="outline"
                icon="i-lucide-x"
                label="Cancelar assinatura"
                :loading="cancelling"
                @click="cancel"
              />
            </div>
          </div>
        </UCard>

        <!-- Missing document warning -->
        <UAlert
          v-if="status && status.billingConfigured && !status.hasDocument"
          color="info"
          variant="subtle"
          icon="i-lucide-id-card"
          title="Informe seu CPF/CNPJ"
          description="Para assinar um plano pago, cadastre seu CPF ou CNPJ nas configurações da loja."
        />

        <!-- Plan grid -->
        <div class="grid gap-4 lg:grid-cols-3">
          <UCard
            v-for="plan in paidPlans"
            :key="plan.id"
            :ui="{ root: plan.highlight ? 'ring-2 ring-primary-500' : '' }"
          >
            <div class="flex h-full flex-col gap-4">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-lg font-bold text-highlighted">{{ plan.label }}</h3>
                  <p class="text-sm text-muted">{{ plan.tagline }}</p>
                </div>
                <UBadge v-if="plan.highlight" color="primary" variant="subtle" label="Mais popular" />
              </div>
              <p class="text-2xl font-extrabold text-highlighted">
                {{ formatBrl(plan.monthlyCents) }}<span class="text-sm font-medium text-muted">/mês</span>
              </p>
              <ul class="flex-1 space-y-2 text-sm text-muted">
                <li v-for="f in plan.features" :key="f" class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary-500" />
                  {{ f }}
                </li>
              </ul>
              <UButton
                v-if="status?.plan === plan.id"
                color="neutral"
                variant="soft"
                block
                disabled
                label="Plano atual"
              />
              <UButton
                v-else
                color="primary"
                :variant="plan.highlight ? 'solid' : 'outline'"
                block
                :ui="{ base: plan.highlight ? 'text-white' : '' }"
                :loading="subscribing === plan.id"
                :disabled="pending || !status?.billingConfigured || (status && status.billingConfigured && !status.hasDocument)"
                :label="status && status.plan !== 'free' ? 'Trocar para este plano' : `Assinar ${plan.label}`"
                @click="subscribe(plan.id)"
              />
            </div>
          </UCard>
        </div>

        <p class="text-xs text-muted">
          Ao assinar, você escolhe a forma de pagamento (Pix, boleto ou cartão) na página de cobrança.
          A cobrança é mensal e você pode cancelar quando quiser.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
