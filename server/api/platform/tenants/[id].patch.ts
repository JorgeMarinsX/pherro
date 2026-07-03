import { z } from 'zod'
import { backendFetchAsUser } from '~~/server/utils/backend'
import { requirePlatformSession } from '~~/server/utils/session'

const bodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  plan: z.string().min(1).max(40).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
})

export default defineEventHandler(async (event) => {
  await requirePlatformSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos' })
  }
  return await backendFetchAsUser(event, `/platform/tenants/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: body.data,
  })
})
