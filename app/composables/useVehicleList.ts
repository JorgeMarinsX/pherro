import type { ComputedRef, Ref } from '#imports'
import type { Vehicle } from '~/types/vehicle'
import { TRANSMISSION_LABELS, FUEL_LABELS } from '~/types/vehicle'

interface VehicleListResponse {
  items: Vehicle[]
  total: number
  take: number
  skip: number
}

const PAGE_SIZE = 12
const MIN_YEAR = 1900
const MAX_YEAR = new Date().getFullYear() + 1

// Sentinel 'all' instead of '' — Reka UI SelectItem forbids empty-string values.
// Mapped back to undefined in buildQuery so the filter is omitted.
const ALL = 'all'

const sortOptions = [
  { label: 'Mais recentes', value: 'newest' },
  { label: 'Menor preço', value: 'price_asc' },
  { label: 'Maior preço', value: 'price_desc' },
  { label: 'Ano (novo → velho)', value: 'year_desc' },
  { label: 'Menor km', value: 'mileage_asc' },
]
const transmissionOptions = [
  { label: 'Todas', value: ALL },
  ...Object.entries(TRANSMISSION_LABELS).map(([value, label]) => ({ label, value })),
]
const fuelOptions = [
  { label: 'Todos', value: ALL },
  ...Object.entries(FUEL_LABELS).map(([value, label]) => ({ label, value })),
]

function toNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function isValidYear(v: number | undefined): boolean {
  return v != null && Number.isInteger(v) && v >= MIN_YEAR && v <= MAX_YEAR
}

export interface VehicleListState {
  // filter refs (v-model targets in VehicleFilters)
  search: Ref<string>
  make: Ref<string>
  yearMin: Ref<number | undefined>
  yearMax: Ref<number | undefined>
  priceMin: Ref<number | undefined>
  priceMax: Ref<number | undefined>
  transmission: Ref<string>
  fuelType: Ref<string>
  sort: Ref<string>
  page: Ref<number>
  // select options + bounds
  sortOptions: typeof sortOptions
  transmissionOptions: typeof transmissionOptions
  fuelOptions: typeof fuelOptions
  minYear: number
  maxYear: number
  isValidYear: typeof isValidYear
  // results
  vehicles: ComputedRef<Vehicle[]>
  total: ComputedRef<number>
  totalPages: ComputedRef<number>
  pending: Ref<boolean>
  error: Ref<unknown>
  pageSize: number
  // actions / derived
  clearFilters: () => void
  hasActiveFilters: ComputedRef<boolean>
}

export function useVehicleList(): VehicleListState {
  const config = useRuntimeConfig()
  const baseUrl = import.meta.server ? config.backendUrl : config.public.backendUrl

  const route = useRoute()
  const router = useRouter()

  // --- Filter / search state (initialized from URL, kept in sync) ---
  const search = ref((route.query.q as string) ?? '')
  const make = ref((route.query.make as string) ?? '')
  const yearMin = ref<number | undefined>(toNum(route.query.yearMin))
  const yearMax = ref<number | undefined>(toNum(route.query.yearMax))
  const priceMin = ref<number | undefined>(toNum(route.query.priceMin))
  const priceMax = ref<number | undefined>(toNum(route.query.priceMax))
  const transmission = ref<string>((route.query.transmission as string) || ALL)
  const fuelType = ref<string>((route.query.fuelType as string) || ALL)
  const sort = ref<string>((route.query.sort as string) ?? 'newest')
  const page = ref(Math.max(1, toNum(route.query.page) ?? 1))

  // --- Query object that drives the fetch. ---
  const skip = computed(() => (page.value - 1) * PAGE_SIZE)

  function buildQuery(skipValue: number): Record<string, string | number> {
    const q: Record<string, string | number> = {
      status: 'ACTIVE',
      take: PAGE_SIZE,
      skip: skipValue,
      sort: sort.value,
    }
    if (search.value.trim()) q.q = search.value.trim()
    if (make.value.trim()) q.make = make.value.trim()
    // Only send valid 4-digit years. Empty UInput w/ .number yields NaN, and
    // partial typing (e.g. "2") is out of range — both must be omitted, else the
    // backend's @IsInt @Min(1900) rejects with 400.
    if (isValidYear(yearMin.value)) q.yearMin = yearMin.value!
    if (isValidYear(yearMax.value)) q.yearMax = yearMax.value!
    if (Number.isFinite(priceMin.value)) q.priceMin = priceMin.value!
    if (Number.isFinite(priceMax.value)) q.priceMax = priceMax.value!
    if (transmission.value && transmission.value !== ALL) q.transmission = transmission.value
    if (fuelType.value && fuelType.value !== ALL) q.fuelType = fuelType.value
    return q
  }

  // Debounced snapshot of the query — useFetch watches THIS, not the live query.
  // Every filter input (search, year, price, selects) settles for 350ms before a
  // request fires, so dragging through values is one request, not one per keystroke
  // (avoids the rate limiter's 429). Initialized eagerly so SSR/first load fetches.
  const debouncedQuery = ref<Record<string, string | number>>(buildQuery(skip.value))

  // No await: useFetch registers with Nuxt's payload and SSR blocks on it
  // automatically. Awaiting inside a nested async composable drops the Nuxt
  // instance context on resume → "composable called outside setup" 500.
  const { data, pending, error } = useFetch<VehicleListResponse>(`${baseUrl}/vehicles`, {
    key: 'veiculos-list',
    query: debouncedQuery,
    default: () => ({ items: [], total: 0, take: PAGE_SIZE, skip: 0 }),
  })

  const vehicles = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
  const hasNext = computed(() => page.value < totalPages.value)

  // --- Prefetch next page: only fetches the page after current. Warms Nuxt
  // payload cache + backend per-id cache (see instructions §7.1). One extra slim
  // query, not the whole inventory — that would be the real perf trap. ---
  const debouncedNextQuery = ref<Record<string, string | number>>(buildQuery(skip.value + PAGE_SIZE))
  const prefetch = useFetch<VehicleListResponse>(`${baseUrl}/vehicles`, {
    key: 'veiculos-list-prefetch',
    query: debouncedNextQuery,
    immediate: false,
    default: () => ({ items: [], total: 0, take: PAGE_SIZE, skip: 0 }),
  })
  // Prefetch fires only on the settled query, never mid-type.
  watch([hasNext, debouncedNextQuery], ([next]: [boolean, unknown]) => {
    if (import.meta.client && next) prefetch.execute()
  }, { immediate: true })

  // Commit the live query → debounced refs that actually drive the fetches.
  function commitQuery() {
    debouncedQuery.value = buildQuery(skip.value)
    debouncedNextQuery.value = buildQuery(skip.value + PAGE_SIZE)
  }

  // --- Sync state → URL (shareable, back-button friendly). Resets page on filter change. ---
  const filterState = computed(() => ({
    q: search.value.trim() || undefined,
    make: make.value.trim() || undefined,
    yearMin: isValidYear(yearMin.value) ? yearMin.value : undefined,
    yearMax: isValidYear(yearMax.value) ? yearMax.value : undefined,
    priceMin: Number.isFinite(priceMin.value) ? priceMin.value : undefined,
    priceMax: Number.isFinite(priceMax.value) ? priceMax.value : undefined,
    transmission: transmission.value !== ALL ? transmission.value : undefined,
    fuelType: fuelType.value !== ALL ? fuelType.value : undefined,
    sort: sort.value === 'newest' ? undefined : sort.value,
  }))

  // Any filter change (search, make, year, price, selects) is debounced 350ms:
  // reset to page 1, then commit the query → one request per settled state, no 429.
  let filterTimer: ReturnType<typeof setTimeout> | undefined
  watch(
    [search, make, yearMin, yearMax, priceMin, priceMax, transmission, fuelType, sort],
    () => {
      clearTimeout(filterTimer)
      filterTimer = setTimeout(() => {
        page.value = 1
        commitQuery()
      }, 350)
    },
  )

  // Pagination clicks are deliberate, single events — commit immediately (no debounce).
  watch(page, () => commitQuery())

  // "Até" must not be below "De": clamp yearMax up to yearMin once both are valid.
  watch([yearMin, yearMax], () => {
    if (isValidYear(yearMin.value) && isValidYear(yearMax.value)
      && yearMax.value! < yearMin.value!) {
      yearMax.value = yearMin.value
    }
  })

  // Push current state to URL whenever filters or page change.
  watch([filterState, page], () => {
    router.replace({
      query: {
        ...filterState.value,
        page: page.value > 1 ? page.value : undefined,
      },
    })
  })

  function clearFilters() {
    clearTimeout(filterTimer)
    search.value = ''
    make.value = ''
    yearMin.value = undefined
    yearMax.value = undefined
    priceMin.value = undefined
    priceMax.value = undefined
    transmission.value = ALL
    fuelType.value = ALL
    sort.value = 'newest'
    page.value = 1
    commitQuery()
  }

  const hasActiveFilters = computed(() =>
    !!(search.value || make.value || yearMin.value || yearMax.value
      || priceMin.value || priceMax.value
      || transmission.value !== ALL || fuelType.value !== ALL
      || sort.value !== 'newest'),
  )

  return {
    search,
    make,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    transmission,
    fuelType,
    sort,
    page,
    sortOptions,
    transmissionOptions,
    fuelOptions,
    minYear: MIN_YEAR,
    maxYear: MAX_YEAR,
    isValidYear,
    vehicles,
    total,
    totalPages,
    pending,
    error,
    pageSize: PAGE_SIZE,
    clearFilters,
    hasActiveFilters,
  }
}
