import type { AuthRole } from '~~/shared/roles'
import { backendFetch } from '~~/server/utils/backend'
import { clearSession, readSession, writeSession } from '~~/server/utils/session'

type RefreshResponse = {
  accessToken: string
  refreshToken: string
  email: string
  role: AuthRole
}

export default defineEventHandler(async (event) => {
  const session = await readSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }

  try {
    const res = await backendFetch<RefreshResponse>(event, '/auth/refresh', {
      method: 'POST',
      body: { refreshToken: session.refreshToken },
    })
    await writeSession(event, {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      email: res.email,
      role: res.role,
    })
    return { ok: true, email: res.email, role: res.role }
  } catch {
    clearSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada' })
  }
})
