// Public photo delivery: browser → BFF → backend static files. Backend sets
// immutable cache headers (keys are UUIDs, never rewritten), so browsers cache
// hard and repeat views never re-hit the stack. With S3/CDN later, photo URLs
// become absolute and this route simply stops being used.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.backendUrl) {
    throw createError({ statusCode: 500, statusMessage: 'BACKEND_URL not configured' })
  }
  return proxyRequest(event, `${config.backendUrl}${event.path}`)
})
