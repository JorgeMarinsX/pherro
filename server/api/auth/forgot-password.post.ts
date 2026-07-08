import { z } from 'zod'
import { backendFetch } from '~~/server/utils/backend'

const bodySchema = z.object({
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail inválido' })
  }

  try {
    await backendFetch(event, '/auth/forgot-password', {
      method: 'POST',
      body: { email: body.data.email },
    })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode
      ?? (err as { response?: { status?: number } }).response?.status
    if (status === 429) {
      throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Tente novamente em instantes.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Falha ao processar a solicitação' })
  }

  return { ok: true }
})
