import { backendFetchAsUser } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await backendFetchAsUser(event, `/campaigns/${id}`, { method: 'DELETE' })
})
