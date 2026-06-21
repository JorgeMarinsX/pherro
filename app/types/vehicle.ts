// Frontend never imports @prisma/client (index.md §6). Hand-mirror the backend
// DTOs here and keep in sync with prisma/schema.prisma + vehicles/dto/.

export type Transmission = 'MANUAL' | 'AUTOMATIC' | 'CVT'
export type FuelType = 'FLEX' | 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'ELECTRIC'
export type VehicleStatus = 'ACTIVE' | 'INACTIVE'

export interface VehiclePhoto {
  id: string
  url: string
  position: number
}

export interface Vehicle {
  id: string
  slug: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  color: string
  description?: string | null
  transmission: Transmission
  fuelType: FuelType
  status: VehicleStatus
  photos?: VehiclePhoto[]
}

// Editable fields surfaced in the create/edit form. Optional id present = edit mode.
export interface VehicleFormState {
  make: string
  model: string
  year: number | undefined
  price: number | undefined
  mileage: number | undefined
  color: string
  transmission: Transmission
  fuelType: FuelType
  status: VehicleStatus
  description: string
}

export interface VehicleWhatsapp {
  id: string
  label: string
  description?: string | null
  number: string
  isActive: boolean
}

// Editable fields surfaced in the create/edit form. Optional id present = edit mode.
export interface WhatsappFormState {
  label: string
  description: string
  number: string
  isActive: boolean
}

// Explicit payloads sent to the BFF — never spread form state raw
// (forbidNonWhitelisted 400s on extras).
export interface WhatsappCreatePayload {
  label: string
  description?: string | null
  number: string
  isActive?: boolean
}

export type WhatsappUpdatePayload = Partial<WhatsappCreatePayload>

export interface VehicleAttributeValue {
  attributeDefinitionId: string
  value: string
}

export interface VehicleDetail extends Vehicle {
  whatsappNumber: VehicleWhatsapp | null
  attributes: VehicleAttributeValue[]
}

// Paginated list envelope returned by GET /vehicles (and the admin BFF proxy).
export interface VehicleListResponse {
  items: Vehicle[]
  total: number
  take: number
  skip: number
}

// What the create/edit form actually sends to the BFF. Built explicitly in the
// modal — never spread `state` raw, since forbidNonWhitelisted 400s on extras.
export interface VehicleCreatePayload {
  make: string
  model: string
  year: number
  price: number
  mileage: number
  color: string
  description?: string | null
  transmission: Transmission
  fuelType: FuelType
  status?: VehicleStatus
  whatsappNumberId?: string | null
  photos?: { url: string; position: number }[]
  attributes?: { attributeDefinitionId: string; value: string }[]
}

export type VehicleUpdatePayload = Partial<VehicleCreatePayload>

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  MANUAL: 'Manual',
  AUTOMATIC: 'Automático',
  CVT: 'CVT',
}

export const FUEL_LABELS: Record<FuelType, string> = {
  FLEX: 'Flex',
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  DIESEL: 'Diesel',
  ELECTRIC: 'Elétrico',
}
