// TODO: replace with Prisma-generated types once API endpoints + client are wired up.
// Mirrors prisma/schema.prisma (AttributeDefinition) — keep in sync until generated client is consumed.

export type AttributeType = 'BOOLEAN' | 'ENUM' | 'TEXT'

export interface AttributeDefinition {
  id: string
  name: string
  slug: string
  icon?: string | null
  type: AttributeType
  options?: string[] | null
}

// Editable fields surfaced in the create/edit form. Optional id present = edit mode.
export interface AttributeFormState {
  name: string
  slug: string
  icon: string
  type: AttributeType
  options: string[]
}

// Explicit payloads sent to the BFF — never spread form state raw
// (forbidNonWhitelisted 400s on extras).
export interface AttributeCreatePayload {
  name: string
  slug: string
  icon?: string | null
  type: AttributeType
  options?: string[]
}

export type AttributeUpdatePayload = Partial<AttributeCreatePayload>

export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  BOOLEAN: 'Sim/Não',
  ENUM: 'Lista de opções',
  TEXT: 'Texto livre',
}
