import type { AuthRole } from './decorators/roles.decorator'

export type AuthUser = {
  sub: string
  email: string
  role: AuthRole
  isEnvAdmin: boolean
}

export type JwtPayload = {
  sub: string
  email: string
  role: AuthRole
  typ?: 'refresh'
  iat?: number
  exp?: number
}
