import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await backendFetch(event, '/vehicles', { admin: true, method: 'POST', body })
})
