import { backendFetchAsUser } from '~~/server/utils/backend'
import { requirePlatformSession } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requirePlatformSession(event)
  const key = getRouterParam(event, 'key')
  const body = await readBody(event)
  return await backendFetchAsUser(event, `/platform/email-templates/${key}/test`, {
    method: 'POST',
    body,
  })
})
