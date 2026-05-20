import type { H3Event } from 'h3'

type BackendFetchOptions = Parameters<typeof $fetch>[1] & {
  admin?: boolean
}

/**
 * Server-only helper to call the NestJS backend.
 * Set `admin: true` to inject the X-Admin-Token header (SSR-only secret).
 * Never call this from `app/` — only from `server/`.
 */
export async function backendFetch<T = unknown>(
  event: H3Event | null,
  path: string,
  opts: BackendFetchOptions = {},
): Promise<T> {
  const { admin, headers, ...rest } = opts
  const config = useRuntimeConfig(event ?? undefined)

  const baseUrl = config.backendUrl
  if (!baseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'BACKEND_URL not configured' })
  }

  const mergedHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
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

  return await $fetch<T>(path, {
    baseURL: baseUrl,
    headers: mergedHeaders,
    ...rest,
  })
}
