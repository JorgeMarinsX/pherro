import { backendFetch } from '~~/server/utils/backend'
import { readSession } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  try {
    // Forward the refresh token so the backend revokes the whole family.
    const session = await readSession(event)
    await backendFetch(event, '/auth/logout', {
      method: 'POST',
      body: session?.refreshToken ? { refreshToken: session.refreshToken } : {},
    })
  } catch {
    // best-effort; ignore
  }
  clearSession(event)
  return { ok: true }
})
