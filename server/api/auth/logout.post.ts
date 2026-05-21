import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  try {
    await backendFetch(event, '/auth/logout', { method: 'POST' })
  } catch {
    // best-effort; ignore
  }
  clearSession(event)
  return { ok: true }
})
