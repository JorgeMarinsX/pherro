import type { Ref } from '#imports'
import type { Vehicle } from '~/types/vehicle'

interface VehicleListResponse {
  items: Vehicle[]
  total: number
  take: number
  skip: number
}

const SUGGEST_LIMIT = 6
const DEBOUNCE_MS = 350

export interface VehicleSearchState {
  query: Ref<string>
  results: Ref<Vehicle[]>
  searching: Ref<boolean>
  open: Ref<boolean>
  submit: () => ReturnType<typeof navigateTo>
  goToVehicle: (slug: string) => ReturnType<typeof navigateTo>
}

/**
 * Live autocomplete over the same `GET /vehicles?q=` endpoint the listing page
 * (useVehicleList) hits — single source of truth for vehicle search. The dropdown
 * shows top matches; submit/Enter hands off to /veiculos with the query pre-applied,
 * where useVehicleList re-runs the identical backend search (now paginated/filterable).
 */
export function useVehicleSearch(): VehicleSearchState {
  const config = useRuntimeConfig()
  const baseUrl = import.meta.server ? config.backendUrl : config.public.backendUrl

  const query = ref('')
  const term = computed(() => query.value.trim())

  // Debounced term drives the fetch — typing settles before a request fires,
  // matching useVehicleList's debounce so we don't trip the rate limiter.
  const debouncedTerm = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(term, (t) => {
    clearTimeout(timer)
    timer = setTimeout(() => { debouncedTerm.value = t }, DEBOUNCE_MS)
  })

  const { data, status } = useFetch<VehicleListResponse>(`${baseUrl}/vehicles`, {
    key: 'vehicle-search',
    query: { status: 'ACTIVE', take: SUGGEST_LIMIT, q: debouncedTerm },
    immediate: false,
    server: false,
    watch: [debouncedTerm],
    default: () => ({ items: [], total: 0, take: 0, skip: 0 }),
  })

  const results = computed(() => (debouncedTerm.value ? data.value?.items ?? [] : []))
  const searching = computed(() => status.value === 'pending')

  const open = ref(false)
  watch(debouncedTerm, (t) => { open.value = !!t })

  // Hand off to the listing page; useVehicleList reads route.query.q on mount.
  function submit() {
    open.value = false
    return term.value
      ? navigateTo({ path: '/veiculos', query: { q: term.value } })
      : navigateTo('/veiculos')
  }

  function goToVehicle(slug: string) {
    open.value = false
    return navigateTo(`/veiculos/${slug}`)
  }

  return { query, results, searching, open, submit, goToVehicle }
}
