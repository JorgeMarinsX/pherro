import { backendFetch } from '~~/server/utils/backend'

// Public vehicle detail by slug (tenant-scoped via forwarded host).
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  try {
    return await backendFetch(event, `/vehicles/by-slug/${slug}`)
  } catch (err: unknown) {
    const status = (err as { statusCode?: number; response?: { status?: number } }).statusCode
      ?? (err as { response?: { status?: number } }).response?.status
    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Veículo não encontrado' })
    }
    throw err
  }
})
