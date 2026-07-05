<script setup lang="ts">
import { PLANS, PAID_PLAN_IDS, formatBrl } from '~~/shared/plans'

const paidPlans = PAID_PLAN_IDS.map((id) => PLANS[id]!)

useSeoMeta({
  title: 'Pherro — Sua revenda de veículos online em minutos',
  description:
    'Crie o site da sua revenda de veículos em minutos: estoque, anúncios, leads e WhatsApp em um só lugar. Escolha seu plano e comece a vender.',
})

const config = useRuntimeConfig()
const exampleHost = `sualoja.${config.public.appBaseDomain}`
const { demoUrl } = useDemo()

const features = [
  {
    icon: 'i-lucide-globe',
    title: 'Site pronto na hora',
    text: 'Sua loja ganha um site próprio com endereço exclusivo, sem programar nada.',
  },
  {
    icon: 'i-lucide-car-front',
    title: 'Gestão de estoque',
    text: 'Cadastre, edite, ative e desative anúncios de veículos em um painel simples.',
  },
  {
    icon: 'i-lucide-users',
    title: 'Leads e clientes',
    text: 'Todo interessado vira um lead registrado. Nunca mais perca um contato.',
  },
  {
    icon: 'i-simple-icons-whatsapp',
    title: 'WhatsApp integrado',
    text: 'Botão de WhatsApp em cada veículo, com captura do contato antes da conversa.',
  },
  {
    icon: 'i-lucide-sliders-horizontal',
    title: 'Atributos personalizados',
    text: 'Ar-condicionado, câmbio, airbag — defina as características que importam.',
  },
  {
    icon: 'i-lucide-layout-dashboard',
    title: 'Painel completo',
    text: 'Anúncios, leads, configurações e números de WhatsApp em um único lugar.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Crie sua conta',
    text: 'Escolha o nome e o endereço da sua loja. Leva menos de um minuto.',
  },
  {
    number: '2',
    title: 'Cadastre seus veículos',
    text: 'Adicione fotos, preço e características no painel administrativo.',
  },
  {
    number: '3',
    title: 'Receba clientes',
    text: 'Divulgue o link da sua loja e converse com os interessados no WhatsApp.',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative isolate bg-primary-950">
      <div
        class="absolute inset-0 opacity-60"
        style="background-image: radial-gradient(ellipse at top right, rgba(139,26,26,0.55) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(139,26,26,0.35) 0%, transparent 55%)"
      />
      <UContainer class="relative py-10 sm:py-12">
        <div class="mx-auto max-w-3xl text-center">
          <UBadge
            color="neutral"
            variant="solid"
            label="Plataforma para revendas de veículos"
            class="mb-5 bg-white/10 text-white ring-1 ring-white/25 backdrop-blur"
          />
          <h1 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Sua revenda de veículos
            <span class="text-primary-300">online em minutos</span>
          </h1>
          <p class="mx-auto mt-4 max-w-2xl text-base text-white/85">
            Site próprio, gestão de estoque, leads e WhatsApp em um só lugar.
            Crie sua loja e comece a vender hoje — sem programador, sem instalação.
          </p>
          <p class="mt-4 text-sm text-white/60">
            Sua loja no ar em <span class="font-mono text-white/90">{{ exampleHost }}</span>
          </p>
          <p class="mt-6 text-lg font-semibold text-white">
            Pronto para começar?
          </p>
          <div class="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <UButton
              to="#planos"
              color="primary"
              size="xl"
              icon="i-lucide-rocket"
              label="Ver planos e assinar"
              :ui="{ base: 'font-semibold' }"
            />
            <UButton
              :to="demoUrl"
              external
              color="neutral"
              variant="outline"
              size="xl"
              icon="i-lucide-monitor-play"
              label="Testar demonstração ao vivo"
              :ui="{ base: 'bg-white/10 text-white ring-2 ring-white/60 hover:bg-white/20 backdrop-blur' }"
            />
          </div>
          <UButton
            to="#recursos"
            color="neutral"
            variant="link"
            size="sm"
            label="Conhecer recursos"
            class="mt-4 text-white/70 hover:text-white"
          />
        </div>
      </UContainer>
    </section>

    <!-- Features -->
    <UContainer id="recursos" as="section" class="py-14 sm:py-20">
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <h2 class="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Tudo que sua revenda precisa
        </h2>
        <p class="mt-2 text-sm text-neutral-600 sm:text-base">
          Do anúncio ao contato no WhatsApp, o Pherro cuida da presença online da sua loja.
        </p>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="rounded-xl border border-neutral-200 p-6"
        >
          <div class="mb-3 flex items-center gap-3">
            <div class="rounded-lg bg-primary-100 p-3">
              <UIcon :name="feature.icon" class="size-6 text-primary-600" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900">{{ feature.title }}</h3>
          </div>
          <p class="text-sm text-neutral-600">{{ feature.text }}</p>
        </div>
      </div>
    </UContainer>

    <!-- How it works -->
    <section class="bg-neutral-50 py-14 sm:py-20">
      <UContainer>
        <div class="mx-auto mb-10 max-w-2xl text-center">
          <h2 class="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Como funciona
          </h2>
          <p class="mt-2 text-sm text-neutral-600 sm:text-base">
            Três passos entre você e sua loja online.
          </p>
        </div>
        <div class="relative grid gap-10 sm:grid-cols-3 sm:gap-6">
          <!-- connector line between circles (desktop) -->
          <div class="absolute left-1/6 right-1/6 top-5 hidden h-0.5 bg-primary-200 sm:block" aria-hidden="true" />
          <div
            v-for="step in steps"
            :key="step.number"
            class="relative flex flex-col items-center gap-3 text-center"
          >
            <div class="flex size-10 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white ring-8 ring-neutral-50">
              {{ step.number }}
            </div>
            <h3 class="text-lg font-semibold text-neutral-900">{{ step.title }}</h3>
            <p class="text-sm text-neutral-600">{{ step.text }}</p>
          </div>
        </div>
        <div class="mt-10 flex justify-center">
          <UButton
            to="#planos"
            color="primary"
            size="lg"
            icon="i-lucide-rocket"
            label="Escolher meu plano"
            :ui="{ base: 'font-semibold' }"
          />
        </div>
      </UContainer>
    </section>

    <!-- Pricing -->
    <UContainer id="planos" as="section" class="py-14 sm:py-20">
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <h2 class="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Planos para cada tamanho de revenda
        </h2>
        <p class="mt-2 text-sm text-neutral-600 sm:text-base">
          Escolha o plano da sua revenda e comece a vender. Pague com Pix, boleto ou cartão.
        </p>
      </div>
      <p class="mx-auto -mt-6 mb-10 max-w-2xl text-center text-sm text-neutral-600">
        Quer ver antes de assinar?
        <NuxtLink :to="demoUrl" external class="font-semibold text-primary-600 hover:underline">
          Acesse a demonstração ao vivo
        </NuxtLink>
        — painel e site de uma loja fictícia, sem cadastro.
      </p>

      <div class="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        <!-- Paid tiers -->
        <UCard
          v-for="plan in paidPlans"
          :key="plan.id"
          :ui="{ root: plan.highlight ? 'ring-2 ring-primary-600' : '' }"
        >
          <div class="flex h-full flex-col gap-4 p-1">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-bold text-neutral-900">{{ plan.label }}</h3>
                <p class="text-sm text-neutral-500">{{ plan.tagline }}</p>
              </div>
              <UBadge v-if="plan.highlight" color="primary" variant="subtle" label="Mais popular" />
            </div>
            <p class="text-3xl font-extrabold text-neutral-900">
              {{ formatBrl(plan.monthlyCents) }}<span class="text-sm font-medium text-neutral-500">/mês</span>
            </p>
            <ul class="flex-1 space-y-2 text-sm text-neutral-700">
              <li v-for="f in plan.features" :key="f" class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary-600" />
                {{ f }}
              </li>
            </ul>
            <UButton
              :to="`/cadastro?plan=${plan.id}`"
              :color="plan.highlight ? 'primary' : 'neutral'"
              :variant="plan.highlight ? 'solid' : 'outline'"
              size="lg"
              block
              :label="`Assinar ${plan.label}`"
            />
          </div>
        </UCard>
      </div>
      <p class="mt-6 text-center text-xs text-neutral-500">
        A cobrança é mensal e você escolhe a forma de pagamento (Pix, boleto ou cartão) na hora de assinar.
        Sua loja fica no ar assim que o primeiro pagamento é confirmado.
      </p>
    </UContainer>

    <!-- Final CTA -->
    <section class="bg-primary-600 py-14 sm:py-16">
      <UContainer class="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div>
          <h2 class="text-2xl font-bold text-white sm:text-3xl">
            Pronto para colocar sua revenda online?
          </h2>
          <p class="mt-2 text-white/90">
            Escolha seu plano e publique seu primeiro veículo hoje mesmo.
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <UButton
            to="#planos"
            color="neutral"
            size="xl"
            icon="i-lucide-rocket"
            label="Ver planos"
            :ui="{ base: 'bg-white text-primary-700 hover:bg-neutral-100 font-semibold' }"
          />
          <UButton
            :to="demoUrl"
            external
            color="neutral"
            variant="outline"
            size="xl"
            icon="i-lucide-monitor-play"
            label="Ver demonstração"
            :ui="{ base: 'bg-primary-700 text-white ring-2 ring-white/70 hover:bg-primary-800' }"
          />
        </div>
      </UContainer>
    </section>
  </div>
</template>
