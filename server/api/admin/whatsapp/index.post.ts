import { backendFetchAsUser } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await backendFetchAsUser(event, '/whatsapp-numbers', { method: 'POST', body })
})
