import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await backendFetch(event, '/leads', { admin: true, query })
})
