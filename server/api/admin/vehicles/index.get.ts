import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await backendFetch(event, '/vehicles', { admin: true, query })
})
