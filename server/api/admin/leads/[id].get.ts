import { backendFetch } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await backendFetch(event, `/leads/${id}`, { admin: true })
})
