import { z } from 'zod'
import { backendFetch } from '~~/server/utils/backend'

const bodySchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos' })
  }

  try {
    await backendFetch(event, '/auth/reset-password', {
      method: 'POST',
      body: { token: body.data.token, password: body.data.password },
    })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode
      ?? (err as { response?: { status?: number } }).response?.status
    if (status === 400) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Link inválido ou expirado. Solicite uma nova redefinição.',
      })
    }
    if (status === 429) {
      throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Tente novamente em instantes.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Falha ao redefinir a senha' })
  }

  return { ok: true }
})
