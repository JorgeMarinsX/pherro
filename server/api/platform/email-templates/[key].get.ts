import { backendFetchAsUser } from '~~/server/utils/backend'
import { requirePlatformSession } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requirePlatformSession(event)
  const key = getRouterParam(event, 'key')
  return await backendFetchAsUser(event, `/platform/email-templates/${key}`)
})
