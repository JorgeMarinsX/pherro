import { backendFetchAsUser } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await backendFetchAsUser(event, '/vehicles', { query })
})
