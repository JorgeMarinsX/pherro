import type { AttributeDefinition } from '~/types/attribute'
import type { Transmission, FuelType } from '~/types/vehicle'
import { TRANSMISSION_LABELS, FUEL_LABELS } from '~/types/vehicle'

// Shared lookup lists for vehicle attribute enums (transmission, fuel).
// Single source for option arrays so list pages and forms stop rebuilding them
// inline. Public display labels only — no fetch, no PII, no secret.
export interface AttributeOption<T extends string = string> {
  label: string
  value: T
}

export const useAttributesStore = defineStore('attributes', () => {
  // Reactive so a future definitions endpoint can replace them; seeded from constants.
  const transmissionLabels = ref<Record<Transmission, string>>({ ...TRANSMISSION_LABELS })
  const fuelLabels = ref<Record<FuelType, string>>({ ...FUEL_LABELS })

  const transmissionOptions = computed<AttributeOption<Transmission>[]>(() =>
    (Object.entries(transmissionLabels.value) as [Transmission, string][]).map(
      ([value, label]) => ({ value, label }),
    ),
  )
  const fuelOptions = computed<AttributeOption<FuelType>[]>(() =>
    (Object.entries(fuelLabels.value) as [FuelType, string][]).map(
      ([value, label]) => ({ value, label }),
    ),
  )

  function transmissionLabel(v: Transmission): string {
    return transmissionLabels.value[v] ?? v
  }
  function fuelLabel(v: FuelType): string {
    return fuelLabels.value[v] ?? v
  }

  // Definitions slice — public display metadata only (name/slug/icon/type).
  // No token, no PII (pinia_state_plan.md §4).
  const definitions = ref<AttributeDefinition[]>([])

  async function fetchDefinitions() {
    // BFF proxy; useRequestFetch forwards SSR cookies (mirrors auth store).
    const request = useRequestFetch()
    definitions.value = await request<AttributeDefinition[]>('/api/admin/attributes')
  }

  const byId = computed(() => new Map(definitions.value.map(d => [d.id, d])))
  function iconFor(id: string): string {
    return byId.value.get(id)?.icon ?? 'i-lucide-tag'
  }
  function nameFor(id: string): string {
    return byId.value.get(id)?.name ?? id
  }

  return {
    transmissionLabels,
    fuelLabels,
    transmissionOptions,
    fuelOptions,
    transmissionLabel,
    fuelLabel,
    definitions,
    fetchDefinitions,
    iconFor,
    nameFor,
  }
})
