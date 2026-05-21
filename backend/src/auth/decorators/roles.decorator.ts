import { SetMetadata } from '@nestjs/common'

export type AuthRole = 'ADMIN' | 'STAFF' | 'SUPERUSER'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles)
