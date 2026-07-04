// Plan catalog. Values in cents (int) — convert to decimal BRL only at the API boundary.
export interface Plan {
  id: string
  label: string
  monthlyCents: number
}

export const PLANS: Record<string, Plan> = {
  free: { id: 'free', label: 'Grátis', monthlyCents: 0 },
  pro: { id: 'pro', label: 'Pro', monthlyCents: 9990 },
}

export const centsToBrl = (cents: number): number => Math.round(cents) / 100
