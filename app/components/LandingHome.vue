<script setup lang="ts">
useSeoMeta({
  title: 'Pherro — Sua revenda de veículos online em minutos',
  description:
    'Crie o site da sua revenda de veículos em minutos: estoque, anúncios, leads e WhatsApp em um só lugar. Comece grátis.',
})

const config = useRuntimeConfig()
const exampleHost = `sualoja.${config.public.appBaseDomain}`

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
      <UContainer class="relative py-20 sm:py-28 lg:py-32">
        <div class="mx-auto max-w-3xl text-center">
          <UBadge
            color="neutral"
            variant="solid"
            label="Plataforma para revendas de veículos"
            class="mb-5 bg-white/10 text-white ring-1 ring-white/25 backdrop-blur"
          />
          <h1 class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Sua revenda de veículos
            <span class="text-primary-300">online em minutos</span>
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
            Site próprio, gestão de estoque, leads e WhatsApp em um só lugar.
            Crie sua loja e comece a vender hoje — sem programador, sem instalação.
          </p>
          <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <UButton
              to="/cadastro"
              color="primary"
              size="xl"
              icon="i-lucide-rocket"
              label="Criar minha loja grátis"
              :ui="{ base: 'font-semibold' }"
            />
            <UButton
              to="#recursos"
              color="neutral"
              variant="outline"
              size="xl"
              label="Conhecer recursos"
              class="text-white ring-white/40 hover:bg-white/10"
            />
          </div>
          <p class="mt-6 text-sm text-white/60">
            Sua loja no ar em <span class="font-mono text-white/90">{{ exampleHost }}</span>
          </p>
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
          class="flex flex-col items-start gap-3 rounded-xl border border-neutral-200 p-6"
        >
          <div class="rounded-lg bg-primary-100 p-3">
            <UIcon :name="feature.icon" class="size-6 text-primary-600" />
          </div>
          <h3 class="text-lg font-semibold text-neutral-900">{{ feature.title }}</h3>
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
        <div class="grid gap-6 sm:grid-cols-3">
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex flex-col items-start gap-3"
          >
            <div class="flex size-10 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
              {{ step.number }}
            </div>
            <h3 class="text-lg font-semibold text-neutral-900">{{ step.title }}</h3>
            <p class="text-sm text-neutral-600">{{ step.text }}</p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Pricing -->
    <UContainer as="section" class="py-14 sm:py-20">
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <h2 class="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Comece grátis
        </h2>
        <p class="mt-2 text-sm text-neutral-600 sm:text-base">
          Sem cartão de crédito. Planos pagos com mais recursos em breve.
        </p>
      </div>
      <div class="mx-auto max-w-md">
        <UCard :ui="{ root: 'ring-2 ring-primary-600' }">
          <div class="flex flex-col items-center gap-4 p-2 text-center">
            <UBadge color="primary" variant="subtle" label="Plano gratuito" />
            <p class="text-4xl font-extrabold text-neutral-900">
              R$ 0<span class="text-base font-medium text-neutral-500">/mês</span>
            </p>
            <ul class="space-y-2 text-sm text-neutral-700">
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-4 text-primary-600" />
                Site da loja com endereço próprio
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-4 text-primary-600" />
                Anúncios de veículos ilimitados
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-4 text-primary-600" />
                Captura de leads com WhatsApp
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="size-4 text-primary-600" />
                Painel administrativo completo
              </li>
            </ul>
            <UButton
              to="/cadastro"
              color="primary"
              size="lg"
              block
              label="Criar minha loja"
            />
          </div>
        </UCard>
      </div>
    </UContainer>

    <!-- Final CTA -->
    <section class="bg-primary-600 py-14 sm:py-16">
      <UContainer class="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div>
          <h2 class="text-2xl font-bold text-white sm:text-3xl">
            Pronto para colocar sua revenda online?
          </h2>
          <p class="mt-2 text-white/90">
            Crie sua loja agora e publique seu primeiro veículo hoje mesmo.
          </p>
        </div>
        <UButton
          to="/cadastro"
          color="neutral"
          size="xl"
          icon="i-lucide-rocket"
          label="Começar grátis"
          :ui="{ base: 'bg-white text-primary-700 hover:bg-neutral-100 font-semibold' }"
        />
      </UContainer>
    </section>
  </div>
</template>
