// Single source of truth for role identifiers.
// AuthRole = runtime/JWT role (superset). DbRole = persisted Prisma enum.
// SUPERUSER exists only at runtime (env-admin path), never in DB — prevents
// seeding a fake superuser row.

import { UserRole as PrismaUserRole } from '@prisma/client'

export const AUTH_ROLES = ['ADMIN', 'STAFF', 'SUPERUSER'] as const
export type AuthRole = (typeof AUTH_ROLES)[number]

export type DbRole = PrismaUserRole
export const DB_ROLES = ['ADMIN', 'STAFF'] as const satisfies readonly DbRole[]

export const ADMIN_ROLES = ['ADMIN', 'SUPERUSER'] as const satisfies readonly AuthRole[]
export const SUPERUSER = 'SUPERUSER' as const satisfies AuthRole
export const DEFAULT_NEW_USER_ROLE = 'STAFF' as const satisfies DbRole

export const isAdminRole = (r: AuthRole): boolean =>
  (ADMIN_ROLES as readonly AuthRole[]).includes(r)
