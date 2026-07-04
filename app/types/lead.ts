// TODO: replace with Prisma-generated types once API endpoints + client are wired up.
// Mirrors prisma/schema.prisma (Lead) — keep in sync until generated client is consumed.

export type LeadSource = 'MANUAL' | 'FORM'

export interface LeadVehicleInterest {
  id: string
  vehicleId: string
  notes?: string | null
  createdAt?: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  source: LeadSource
  createdAt?: string
  updatedAt?: string
  vehicleInterests?: LeadVehicleInterest[]
}

// Paginated list envelope returned by GET /leads (and the admin BFF proxy).
export interface LeadListResponse {
  items: Lead[]
  total: number
  take: number
  skip: number
}

// Editable fields surfaced in the create/edit form. Optional id present = edit mode.
export interface LeadFormState {
  name: string
  phone: string
  email: string
  notes: string
  source: LeadSource
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  MANUAL: 'Manual',
  FORM: 'Formulário',
}
