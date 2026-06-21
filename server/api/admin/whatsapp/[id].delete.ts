import { backendFetchAsUser } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await backendFetchAsUser(event, `/whatsapp-numbers/${id}`, { method: 'DELETE' })
})
