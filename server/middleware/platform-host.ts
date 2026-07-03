// Host split (mirrors backend TenantResolverService.isPlatformHost):
// platform hosts (app.*/www.*/apex) only serve /platform; tenant hosts never do.
export default defineEventHandler((event) => {
  const path = event.path
  // Pages only — skip API, internals, and asset-like paths.
  if (path.startsWith('/api') || path.startsWith('/_') || path.includes('.')) return

  const base = useRuntimeConfig(event).public.appBaseDomain
  const host = getRequestHost(event, { xForwardedHost: true }).toLowerCase().split(':')[0]
  const isPlatformHost = host === base || host.startsWith('app.') || host.startsWith('www.')

  if (isPlatformHost && !path.startsWith('/platform')) {
    return sendRedirect(event, '/platform', 302)
  }
  if (!isPlatformHost && path.startsWith('/platform')) {
    throw createError({ statusCode: 404, statusMessage: 'Página não encontrada' })
  }
})
