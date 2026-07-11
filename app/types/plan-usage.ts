export interface PlanUsageSummary {
  plan: string
  label: string
  limits: { vehicles: number | null; leads: number | null; emailsPerMonth: number | null; storageMb: number | null }
  usage: { vehicles: number; leads: number; emailsPerMonth: number; storageMb: number }
}

export type LimitKind = keyof PlanUsageSummary['limits']
