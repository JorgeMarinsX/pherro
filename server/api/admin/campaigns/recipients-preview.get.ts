import { backendFetchAsUser } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  return await backendFetchAsUser(event, '/campaigns/recipients-preview')
})
