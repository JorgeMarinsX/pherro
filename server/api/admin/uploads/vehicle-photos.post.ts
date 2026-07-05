import { backendFetchAsUser } from '~~/server/utils/backend'

// Multipart passthrough. Body is buffered (client pre-compresses, so a batch is
// a few MB) — a stream body couldn't be replayed on the 401→refresh→retry path.
export default defineEventHandler(async (event) => {
  const contentType = getHeader(event, 'content-type') ?? ''
  if (!contentType.startsWith('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Envie multipart/form-data.' })
  }

  const body = await readRawBody(event, false)
  if (!body?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhuma imagem enviada.' })
  }

  return await backendFetchAsUser(event, '/uploads/vehicle-photos', {
    method: 'POST',
    body,
    headers: { 'content-type': contentType },
  })
})
