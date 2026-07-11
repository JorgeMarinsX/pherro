import type { LimitKind, PlanUsageSummary } from '~/types/plan-usage'

export const LIMIT_LABELS: Record<LimitKind, string> = {
  vehicles: 'veículos',
  leads: 'leads',
  emailsPerMonth: 'e-mails no mês',
  storageMb: 'MB de fotos',
}

export interface LimitWarning {
  kind: LimitKind
  label: string
  used: number
  limit: number
  ratio: number
}

// Plan limits + current usage for the logged-in tenant admin. Drives the
// near-limit banner, dashboard usage card and disabled create buttons.
export const usePlanUsageStore = defineStore('planUsage', () => {
  const summary = ref<PlanUsageSummary | null>(null)
  const loaded = ref(false)

  // Limit-reached dialog — opened by create flows when the API returns a quota 403.
  const dialogOpen = ref(false)
  const dialogMessage = ref('')

  async function fetchUsage() {
    const request = useRequestFetch()
    try {
      summary.value = await request<PlanUsageSummary>('/api/admin/billing/usage')
      loaded.value = true
    } catch {
      // Usage is decorative here (backend still enforces) — never break the admin UI.
    }
  }

  function limitOf(kind: LimitKind): number | null {
    return summary.value?.limits[kind] ?? null
  }

  function usedOf(kind: LimitKind): number {
    return summary.value?.usage[kind] ?? 0
  }

  function ratioOf(kind: LimitKind): number {
    const limit = limitOf(kind)
    return limit ? usedOf(kind) / limit : 0
  }

  function atLimit(kind: LimitKind): boolean {
    const limit = limitOf(kind)
    return limit !== null && usedOf(kind) >= limit
  }

  // Limits at ≥80% usage, worst first. Unlimited (null) never warns.
  const warnings = computed<LimitWarning[]>(() =>
    (Object.keys(LIMIT_LABELS) as LimitKind[])
      .map((kind) => ({
        kind,
        label: LIMIT_LABELS[kind],
        used: usedOf(kind),
        limit: limitOf(kind) ?? 0,
        ratio: ratioOf(kind),
      }))
      .filter((w) => w.limit > 0 && w.ratio >= 0.8)
      .sort((a, b) => b.ratio - a.ratio),
  )

  function showLimitDialog(message: string) {
    dialogMessage.value = message
    dialogOpen.value = true
  }

  function $reset() {
    summary.value = null
    loaded.value = false
    dialogOpen.value = false
    dialogMessage.value = ''
  }

  return {
    summary, loaded, dialogOpen, dialogMessage,
    fetchUsage, limitOf, usedOf, ratioOf, atLimit, warnings, showLimitDialog, $reset,
  }
})
