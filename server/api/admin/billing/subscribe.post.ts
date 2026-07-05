import { z } from 'zod'
import { backendFetchAsUser } from '~~/server/utils/backend'

const bodySchema = z.object({ planId: z.string().min(1) })

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Plano inválido' })
  }
  return await backendFetchAsUser(event, '/billing/subscribe', {
    method: 'POST',
    body: body.data,
  })
})
