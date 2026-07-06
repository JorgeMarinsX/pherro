import { backendFetchAsUser } from '~~/server/utils/backend'

const KINDS = new Set(['logo', 'hero', 'favicon'])

// Multipart passthrough, same replay rationale as vehicle-photos.
export default defineEventHandler(async (event) => {
  const kind = getRouterParam(event, 'kind') ?? ''
  if (!KINDS.has(kind)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de imagem inválido.' })
  }

  const contentType = getHeader(event, 'content-type') ?? ''
  if (!contentType.startsWith('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Envie multipart/form-data.' })
  }

  const body = await readRawBody(event, false)
  if (!body?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhuma imagem enviada.' })
  }

  return await backendFetchAsUser(event, `/uploads/branding/${kind}`, {
    method: 'POST',
    body,
    headers: { 'content-type': contentType },
  })
})
