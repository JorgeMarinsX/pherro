// Plan catalog. Values in cents (int) — convert to decimal BRL only at the API boundary.
// Mirrors the frontend catalog in shared/plans.ts (separate package, no shared import).
export interface PlanLimits {
  vehicles: number | null // null = unlimited
  leads: number | null
  emailsPerMonth: number | null
  // Photo storage cap. ~2 MB processed images/vehicle (capacity doc) + headroom.
  storageMb: number | null
}

export interface Plan {
  id: string
  label: string
  monthlyCents: number
  limits: PlanLimits
}

export const PLANS: Record<string, Plan> = {
  free: { id: 'free', label: 'Grátis', monthlyCents: 0, limits: { vehicles: 10, leads: 100, emailsPerMonth: 200, storageMb: 30 } },
  inicio: { id: 'inicio', label: 'Início', monthlyCents: 9900, limits: { vehicles: 50, leads: 500, emailsPerMonth: 1000, storageMb: 150 } },
  profissional: { id: 'profissional', label: 'Profissional', monthlyCents: 19900, limits: { vehicles: 200, leads: 3000, emailsPerMonth: 5000, storageMb: 600 } },
  rede: { id: 'rede', label: 'Rede', monthlyCents: 39900, limits: { vehicles: 1000, leads: null, emailsPerMonth: 20000, storageMb: 3000 } },
}

export const PAID_PLAN_IDS = ['inicio', 'profissional', 'rede'] as const

export const isPaidPlan = (id: string): boolean =>
  id !== 'free' && id in PLANS && PLANS[id]!.monthlyCents > 0

export const centsToBrl = (cents: number): number => Math.round(cents) / 100
