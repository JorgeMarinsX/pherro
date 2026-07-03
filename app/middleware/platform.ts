export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/platform/login') return

  // Same server-verified identity flow as middleware/admin.ts, plus a role gate:
  // only PLATFORM_ADMIN sessions may enter the cross-tenant surface.
  const auth = useAuthStore()
  await callOnce('auth:me', () => auth.fetchMe())

  if (!auth.authenticated || auth.role !== 'PLATFORM_ADMIN') {
    return navigateTo(`/platform/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
