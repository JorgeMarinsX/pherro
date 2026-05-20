import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await backendFetch(event, '/shop-config', {
    admin: true,
    method: 'PATCH',
    body,
  })
})
