export default defineEventHandler(async (event) => {
  const url = event.node.req.url ?? ''
  if (!url.startsWith('/api/admin/')) return
  await requireSession(event)
})
