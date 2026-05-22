// Single source of truth for role identifiers on the Nuxt side.
// Mirrors backend/src/auth/roles.ts. Kept in sync manually — duplicated rather
// than imported to keep frontend build decoupled from backend layout.
//
// AuthRole = runtime/JWT role (superset). SUPERUSER exists only at runtime
// (env-admin path), never persisted to DB.

export const AUTH_ROLES = ['ADMIN', 'STAFF', 'SUPERUSER'] as const
export type AuthRole = (typeof AUTH_ROLES)[number]

export const ADMIN_ROLES = ['ADMIN', 'SUPERUSER'] as const satisfies readonly AuthRole[]

export const isAdminRole = (r: AuthRole): boolean =>
  (ADMIN_ROLES as readonly AuthRole[]).includes(r)

export const isAuthRole = (v: unknown): v is AuthRole =>
  typeof v === 'string' && (AUTH_ROLES as readonly string[]).includes(v)
