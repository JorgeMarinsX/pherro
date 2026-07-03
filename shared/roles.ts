// Single source of truth for role identifiers on the Nuxt side.
// Mirrors backend/src/auth/roles.ts. Kept in sync manually — duplicated rather
// than imported to keep frontend build decoupled from backend layout.
//
// AuthRole = runtime/JWT role. PLATFORM_ADMIN is the cross-tenant operator
// (separate PlatformAdmin table, never a tenant User row).

export const AUTH_ROLES = ['PLATFORM_ADMIN', 'ADMIN', 'STAFF'] as const
export type AuthRole = (typeof AUTH_ROLES)[number]

export const ADMIN_ROLES = ['ADMIN', 'PLATFORM_ADMIN'] as const satisfies readonly AuthRole[]

export const isAdminRole = (r: AuthRole): boolean =>
  (ADMIN_ROLES as readonly AuthRole[]).includes(r)

export const isAuthRole = (v: unknown): v is AuthRole =>
  typeof v === 'string' && (AUTH_ROLES as readonly string[]).includes(v)
