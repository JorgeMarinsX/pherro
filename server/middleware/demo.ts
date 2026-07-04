import { isDemoHost } from '~~/shared/host'
import { backendFetch } from '~~/server/utils/backend'
import { readDemoTenant, readSession, writeDemoTenant, writeSession } from '~~/server/utils/session'

// Live demo bootstrap (demo.* hosts, pages only). First visit: provision an
// ephemeral demo tenant on the backend, auto-login as its ADMIN, then redirect
// once so SSR data fetches carry the fresh cookies. The demo_tenant cookie is
// session-scoped — closing the browser discards the visitor's sandbox.
const BOOT_PARAM = '_demoboot'

type DemoSessionResponse = {
  tenantId: string
  slug: string
  accessToken: string
  refreshToken: string
  email: string
  role: 'ADMIN'
}

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? '/'
  if (path.startsWith('/api') || path.startsWith('/_') || path.includes('.')) return

  const host = getRequestHost(event, { xForwardedHost: true })
  if (!isDemoHost(host)) return

  const demoTenantId = await readDemoTenant(event)
  const session = await readSession(event)
  const query = getQuery(event)

  if (demoTenantId && session && session.tenantId === demoTenantId) {
    // Bootstrapped on the previous roundtrip — clean the marker from the URL.
    if (query[BOOT_PARAM] !== undefined) {
      return sendRedirect(event, cleanUrl(event.path), 302)
    }
    return
  }

  // Cookies didn't survive the bootstrap redirect (cookies disabled / stale
  // session edge) — render anyway instead of looping; the demo banner warns.
  const alreadyTried = query[BOOT_PARAM] !== undefined

  let res: DemoSessionResponse
  try {
    res = await backendFetch<DemoSessionResponse>(event, '/platform/demo', {
      method: 'POST',
      admin: true,
      body: demoTenantId ? { tenantId: demoTenantId } : {},
    })
  } catch (err) {
    console.error('[demo] bootstrap failed:', err)
    return
  }

  await writeSession(event, {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    email: res.email,
    role: res.role,
    tenantId: res.tenantId,
  })
  await writeDemoTenant(event, res.tenantId)
  // Same-request backend calls can't read the Set-Cookie we just wrote.
  event.context.demoTenantId = res.tenantId

  if (!alreadyTried) {
    const sep = event.path.includes('?') ? '&' : '?'
    return sendRedirect(event, `${event.path}${sep}${BOOT_PARAM}=1`, 302)
  }
})

function cleanUrl(fullPath: string): string {
  const [path, qs] = fullPath.split('?')
  if (!qs) return path || '/'
  const params = new URLSearchParams(qs)
  params.delete(BOOT_PARAM)
  const rest = params.toString()
  return rest ? `${path}?${rest}` : path || '/'
}
