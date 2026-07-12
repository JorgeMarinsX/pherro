import { z } from 'zod'
import { backendFetch } from '~~/server/utils/backend'

// Public self-service signup — no session; backend throttles per IP.
// Paid plan + CPF/CNPJ are mandatory: there is no free tier on signup.
const bodySchema = z.object({
  slug: z.string().min(3).max(63).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  name: z.string().min(2).max(120),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  cpfCnpj: z.string().regex(/^\d{11}$|^\d{14}$/),
  plan: z.enum(['inicio', 'profissional', 'rede']),
  termsAccepted: z.literal(true),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Dados inválidos' })
  }
  try {
    return await backendFetch<{ id: string; slug: string; name: string; invoiceUrl: string | null }>(
      event,
      '/platform/signup',
      { method: 'POST', body: body.data },
    )
  } catch (err: unknown) {
    const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode
      ?? (err as { response?: { status?: number } }).response?.status
    if (status === 409) {
      throw createError({ statusCode: 409, statusMessage: 'Este endereço já está em uso. Escolha outro.' })
    }
    if (status === 429) {
      throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde um minuto.' })
    }
    throw err
  }
})
