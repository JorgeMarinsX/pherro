// TODO: replace with Prisma-generated types once API endpoints + client are wired up.
// Mirrors prisma/schema.prisma — keep in sync until generated client is consumed.

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
  number: string
}

// Editable fields surfaced in the create/edit form. Optional id present = edit mode.
export interface WhatsappFormState {
  label: string
  number: string
}

export interface VehicleAttributeValue {
  attributeDefinitionId: string
  value: string
}

export interface VehicleDetail extends Vehicle {
  whatsappNumber: VehicleWhatsapp | null
  attributes: VehicleAttributeValue[]
}

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
