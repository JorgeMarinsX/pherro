import { backendFetch } from '~~/server/utils/backend'

// Public storefront list. Proxied through the BFF so the backend resolves the
// tenant from the forwarded host — the browser never talks to Nest directly.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await backendFetch(event, '/vehicles', { query })
})
