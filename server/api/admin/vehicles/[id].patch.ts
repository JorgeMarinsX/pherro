import { backendFetchAsUser } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  return await backendFetchAsUser(event, `/vehicles/${id}`, {
    method: 'PATCH',
    body,
  })
})
