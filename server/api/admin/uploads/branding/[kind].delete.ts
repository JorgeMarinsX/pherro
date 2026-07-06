import { backendFetchAsUser } from '~~/server/utils/backend'

const KINDS = new Set(['logo', 'hero', 'favicon'])

export default defineEventHandler(async (event) => {
  const kind = getRouterParam(event, 'kind') ?? ''
  if (!KINDS.has(kind)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de imagem inválido.' })
  }
  return await backendFetchAsUser(event, `/uploads/branding/${kind}`, { method: 'DELETE' })
})
