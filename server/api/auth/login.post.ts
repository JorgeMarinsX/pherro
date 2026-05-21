import { z } from 'zod'
import { backendFetch } from '~~/server/utils/backend'
import { writeSession } from '~~/server/utils/session'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginResponse = {
  accessToken: string
  refreshToken: string
  email: string
  role: 'ADMIN' | 'STAFF' | 'SUPERUSER'
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Credenciais inválidas' })
  }

  let res: LoginResponse
  try {
    res = await backendFetch<LoginResponse>(event, '/auth/login', {
      method: 'POST',
      body: { email: body.data.email, password: body.data.password },
    })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode
      ?? (err as { response?: { status?: number } }).response?.status
    if (status === 401) {
      throw createError({ statusCode: 401, statusMessage: 'E-mail ou senha incorretos' })
    }
    if (status === 429) {
      throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Tente novamente em instantes.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Falha ao autenticar' })
  }

  await writeSession(event, {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    email: res.email,
    role: res.role,
  })

  return { ok: true, email: res.email, role: res.role }
})
