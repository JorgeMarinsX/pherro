export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return

  // Hydrate identity once (SSR), shared with the admin layout via the store.
  // Route protection is driven by the server-verified /api/auth/me, never by a
  // client-trusted store flag.
  const auth = useAuthStore()
  await callOnce('auth:me', () => auth.fetchMe())

  if (!auth.authenticated) {
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
