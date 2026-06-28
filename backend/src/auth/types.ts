import type { AuthRole } from './roles'

export type AuthUser = {
  sub: string
  email: string
  role: AuthRole
  tenantId: string | null
  isPlatformAdmin: boolean
}

export type JwtPayload = {
  sub: string
  email: string
  role: AuthRole
  tenantId: string | null
  typ?: 'refresh'
  iat?: number
  exp?: number
}
