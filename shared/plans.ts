// Canonical plan catalog — single source shared by landing page, checkout and admin.
// Values in cents (int); convert to decimal BRL only at the Asaas API boundary.
// Backend mirrors this in backend/src/billing/plans.ts (own package, can't import here).

export interface PlanLimits {
  vehicles: number | null // null = unlimited
  leads: number | null
  emailsPerMonth: number | null
}

export interface Plan {
  id: string
  label: string
  monthlyCents: number
  tagline: string
  limits: PlanLimits
  features: string[]
  highlight?: boolean // visually featured tier on the pricing grid
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    label: 'Grátis',
    monthlyCents: 0,
    tagline: 'Para experimentar',
    limits: { vehicles: 10, leads: 100, emailsPerMonth: 200 },
    features: [
      'Site da loja com endereço próprio',
      'Até 10 anúncios de veículos',
      'Captura de leads com WhatsApp',
      'Painel administrativo completo',
    ],
  },
  inicio: {
    id: 'inicio',
    label: 'Início',
    monthlyCents: 9900,
    tagline: 'Solo ou lote pequeno',
    limits: { vehicles: 50, leads: 500, emailsPerMonth: 1000 },
    features: [
      'Até 50 veículos',
      'Até 500 leads',
      'Até 1.000 e-mails por mês',
      'Site próprio + painel completo',
    ],
  },
  profissional: {
    id: 'profissional',
    label: 'Profissional',
    monthlyCents: 19900,
    tagline: 'Revenda em crescimento',
    limits: { vehicles: 200, leads: 3000, emailsPerMonth: 5000 },
    highlight: true,
    features: [
      'Até 200 veículos',
      'Até 3.000 leads',
      'Até 5.000 e-mails por mês',
      'E-mail marketing para clientes',
    ],
  },
  rede: {
    id: 'rede',
    label: 'Rede',
    monthlyCents: 39900,
    tagline: 'Multi-loja / alto volume',
    limits: { vehicles: 1000, leads: null, emailsPerMonth: 20000 },
    features: [
      'Até 1.000 veículos',
      'Leads ilimitados',
      'Até 20.000 e-mails por mês',
      'Ideal para grupos com várias lojas',
    ],
  },
}

// Paid tiers in display order (free shown separately / as entry CTA).
export const PAID_PLAN_IDS = ['inicio', 'profissional', 'rede'] as const
export const ALL_PLAN_IDS = ['free', ...PAID_PLAN_IDS] as const

export const isPaidPlan = (id: string): boolean =>
  id !== 'free' && id in PLANS && PLANS[id]!.monthlyCents > 0

export const centsToBrl = (cents: number): number => Math.round(cents) / 100

// "R$ 99" — whole reais when no cents, else "R$ 99,90".
export const formatBrl = (cents: number): string => {
  const brl = centsToBrl(cents)
  return brl % 1 === 0
    ? `R$ ${brl.toLocaleString('pt-BR')}`
    : `R$ ${brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
