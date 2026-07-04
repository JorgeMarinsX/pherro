// Absolute URL for a tenant surface: host = <slug>.APP_BASE_DOMAIN.
// Scheme/port come from SITE_URL (dev: http://localhost:3000); unset → https, no port.
export function tenantUrl(slug: string, path = '/'): string {
  const base = process.env.APP_BASE_DOMAIN || 'localhost'
  const siteUrl = process.env.SITE_URL
  if (siteUrl) {
    try {
      const site = new URL(siteUrl)
      const port = site.port ? `:${site.port}` : ''
      return `${site.protocol}//${slug}.${base}${port}${path}`
    } catch { /* fall through */ }
  }
  return `https://${slug}.${base}${path}`
}
