import { z } from 'zod'
import { backendFetchAsUser } from '~~/server/utils/backend'
import { requirePlatformSession } from '~~/server/utils/session'

const bodySchema = z.object({
  slug: z.string().min(3).max(63).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  name: z.string().min(2).max(120),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  plan: z.string().min(1).max(40).optional(),
})

export default defineEventHandler(async (event) => {
  await requirePlatformSession(event)
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos' })
  }
  try {
    return await backendFetchAsUser(event, '/platform/tenants', {
      method: 'POST',
      body: body.data,
    })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode
      ?? (err as { response?: { status?: number } }).response?.status
    if (status === 409) {
      throw createError({ statusCode: 409, statusMessage: 'Slug já em uso ou reservado' })
    }
    throw err
  }
})
