import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await backendFetch(event, `/vehicles/${id}`, { admin: true })
})
