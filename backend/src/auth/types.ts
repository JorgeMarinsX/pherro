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
  // Refresh only: token family + the one-time id rotated on every refresh.
  fid?: string
  jti?: string
  iat?: number
  exp?: number
}
