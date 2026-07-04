import type { H3Event } from 'h3'
import type { AuthRole } from '~~/shared/roles'
import { isDemoHost } from '~~/shared/host'
import { clearSession, readDemoTenant, readSession, writeSession } from './session'

type BackendFetchOptions = Parameters<typeof $fetch>[1] & {
  admin?: boolean
  bearer?: string
  event?: H3Event
}

/**
 * Server-only helper to call the NestJS backend.
 * - `admin: true` injects `X-Admin-Token` (S2S secret).
 * - `bearer: token` injects `Authorization: Bearer <token>`.
 * Never call from `app/` — only from `server/`.
 */
export async function backendFetch<T = unknown>(
  event: H3Event | null,
  path: string,
  opts: BackendFetchOptions = {},
): Promise<T> {
  const { admin, bearer, headers, ...rest } = opts
  const config = useRuntimeConfig(event ?? undefined)

  const baseUrl = config.backendUrl
  if (!baseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'BACKEND_URL not configured' })
  }

  const mergedHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  }

  // Tenant context: backend resolves the tenant from the original request host.
  if (event && !mergedHeaders['x-forwarded-host']) {
    const host = getRequestHost(event, { xForwardedHost: true })
    if (host) mergedHeaders['x-forwarded-host'] = host
  }

  // Real client IP — without it the backend throttles all visitors as one caller.
  if (event && !mergedHeaders['x-forwarded-for']) {
    const ip = getRequestIP(event, { xForwardedFor: true })
    if (ip) mergedHeaders['x-forwarded-for'] = ip
  }

  // Demo host: the tenant is per-browser-session (signed cookie), not per-host.
  // x-tenant-id wins over host resolution on the backend (validated there).
  if (event && !mergedHeaders['x-tenant-id']) {
    const host = getRequestHost(event, { xForwardedHost: true })
    if (host && isDemoHost(host)) {
      const demoTenant =
        (event.context.demoTenantId as string | undefined) ?? (await readDemoTenant(event))
      if (demoTenant) mergedHeaders['x-tenant-id'] = demoTenant
    }
  }

  if (admin) {
    const token = config.adminToken
    if (!token) {
      throw createError({
        statusCode: 500,
        statusMessage: 'BACKEND_ADMIN_TOKEN not configured',
      })
    }
    mergedHeaders['X-Admin-Token'] = token
  }

  if (bearer) {
    mergedHeaders['Authorization'] = `Bearer ${bearer}`
  }

  return await $fetch<T>(path, {
    baseURL: baseUrl,
    headers: mergedHeaders,
    ...rest,
  })
}

type RefreshResponse = {
  accessToken: string
  refreshToken: string
  email: string
  role: AuthRole
  tenantId: string | null
}

/**
 * Calls backend with session-bearer auth. On 401, attempts one transparent refresh
 * via the backend's `/auth/refresh`, updates the cookie, and retries the original call.
 * On any failure, clears the session and rethrows.
 */
export async function backendFetchAsUser<T = unknown>(
  event: H3Event,
  path: string,
  opts: Omit<BackendFetchOptions, 'bearer' | 'admin'> = {},
): Promise<T> {
  const session = await readSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    return await backendFetch<T>(event, path, { ...opts, bearer: session.accessToken })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode
      ?? (err as { response?: { status?: number } }).response?.status
    if (status !== 401) throw err

    let refreshed: RefreshResponse
    try {
      refreshed = await backendFetch<RefreshResponse>(event, '/auth/refresh', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      })
    } catch {
      clearSession(event)
      throw createError({ statusCode: 401, statusMessage: 'Sessão expirada' })
    }

    await writeSession(event, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      email: refreshed.email,
      role: refreshed.role,
      tenantId: refreshed.tenantId,
    })

    return await backendFetch<T>(event, path, { ...opts, bearer: refreshed.accessToken })
  }
}
