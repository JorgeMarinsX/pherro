import type { AuthRole } from '~~/shared/roles'
import { isAdminRole } from '~~/shared/roles'

// Current user identity for UI rendering only.
//
// SECURITY: store state is serialized into the SSR payload — treat it as PUBLIC.
// NEVER put accessToken/refreshToken or any secret here; tokens live only in the
// sealed HttpOnly cookie. `email`/`role` are already exposed to the authenticated
// browser by /api/auth/me, so this widens nothing.
//
// `role` is informational for UI only — NEVER an authorization grant. Every
// guarded effect must round-trip the server (BFF reads the cookie; backend
// re-reads the DB role per request). Mutating this ref only changes what renders.
type MeResponse = {
  authenticated: boolean
  email?: string
  role?: AuthRole
}

export const useAuthStore = defineStore('auth', () => {
  const email = ref<string | null>(null)
  const role = ref<AuthRole | null>(null)

  const authenticated = computed(() => !!email.value)
  // Cosmetic gate for admin-only UI affordances. NOT a permission check.
  const isAdmin = computed(() => !!role.value && isAdminRole(role.value))

  // Hydrate from the BFF /api/auth/me (reads the sealed cookie SSR-side).
  // useRequestFetch forwards the incoming request cookies during SSR — plain
  // $fetch does NOT, so the session cookie would be dropped and every reload
  // would read as logged-out.
  async function fetchMe() {
    const request = useRequestFetch()
    const me = await request<MeResponse>('/api/auth/me')
    if (me.authenticated) {
      email.value = me.email ?? null
      role.value = me.role ?? null
    } else {
      $reset()
    }
  }

  function $reset() {
    email.value = null
    role.value = null
  }

  return { email, role, authenticated, isAdmin, fetchMe, $reset }
})
