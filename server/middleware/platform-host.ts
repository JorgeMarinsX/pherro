import { isPlatformHost } from '~~/shared/host'

// Host split (mirrors backend TenantResolverService.isPlatformHost):
// apex/www serve the product LP + /cadastro + /platform; app.* is dashboard-only;
// tenant hosts never serve platform/marketing pages.
export default defineEventHandler((event) => {
  const path = event.path.split('?')[0] ?? '/'
  // Pages only — skip API, internals, and asset-like paths.
  if (path.startsWith('/api') || path.startsWith('/_') || path.includes('.')) return

  const base = useRuntimeConfig(event).public.appBaseDomain
  const host = getRequestHost(event, { xForwardedHost: true }).toLowerCase().split(':')[0]

  if (!isPlatformHost(host, base)) {
    if (path.startsWith('/platform') || path === '/cadastro') {
      throw createError({ statusCode: 404, statusMessage: 'Página não encontrada' })
    }
    return
  }

  // Dashboard host (app.*) has no marketing pages.
  if (host.startsWith('app.') && !path.startsWith('/platform')) {
    return sendRedirect(event, '/platform', 302)
  }
  // Apex/www: marketing + platform pages only — storefront routes don't exist here.
  if (path !== '/' && path !== '/cadastro' && !path.startsWith('/platform')) {
    return sendRedirect(event, '/', 302)
  }
})
