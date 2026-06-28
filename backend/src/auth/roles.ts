// Single source of truth for role identifiers.
// DbRole = persisted Prisma UserRole (tenant users: ADMIN/STAFF).
// PLATFORM_ADMIN is runtime-only — a separate PlatformAdmin table, never a User
// row — and is the ONLY role allowed to escape tenant scoping.

import { UserRole as PrismaUserRole } from '@prisma/client'

export const AUTH_ROLES = ['PLATFORM_ADMIN', 'ADMIN', 'STAFF'] as const
export type AuthRole = (typeof AUTH_ROLES)[number]

export type DbRole = PrismaUserRole
export const DB_ROLES = ['ADMIN', 'STAFF'] as const satisfies readonly DbRole[]

export const ADMIN_ROLES = ['ADMIN', 'PLATFORM_ADMIN'] as const satisfies readonly AuthRole[]
export const PLATFORM_ADMIN = 'PLATFORM_ADMIN' as const satisfies AuthRole
export const DEFAULT_NEW_USER_ROLE = 'STAFF' as const satisfies DbRole

export const isAdminRole = (r: AuthRole): boolean =>
  (ADMIN_ROLES as readonly AuthRole[]).includes(r)

export const isPlatformAdminRole = (r: AuthRole): boolean => r === PLATFORM_ADMIN
