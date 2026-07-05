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

  // Unpaid store: everything is locked to the plan page until the first payment
  // confirms (backend enforces the storefront darkness; this just steers the owner).
  if (to.path !== '/admin/plano') {
    const status = useState<string | null>('tenant:status', () => null)
    if (status.value === null) {
      const s = await $fetch<{ status: string }>('/api/admin/billing/status').catch(() => null)
      status.value = s?.status ?? 'ACTIVE'
    }
    if (status.value === 'PENDING_PAYMENT') {
      return navigateTo('/admin/plano')
    }
  }
})
