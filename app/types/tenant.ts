export type TenantStatus = 'ACTIVE' | 'SUSPENDED'
export type DomainStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'ACTIVE'

export type Tenant = {
  id: string
  slug: string
  name: string
  customDomain: string | null
  domainStatus: DomainStatus
  plan: string
  status: TenantStatus
  createdAt: string
  updatedAt: string
}

export type TenantCreatePayload = {
  slug: string
  name: string
  adminEmail: string
  adminPassword: string
  plan?: string
}

export type TenantUpdatePayload = {
  name?: string
  plan?: string
  status?: TenantStatus
}

export type TenantFormState = {
  slug: string
  name: string
  adminEmail: string
  adminPassword: string
  plan: string
}
