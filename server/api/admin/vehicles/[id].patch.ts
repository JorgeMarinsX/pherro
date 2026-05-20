import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  return await backendFetch(event, `/vehicles/${id}`, {
    admin: true,
    method: 'PATCH',
    body,
  })
})
