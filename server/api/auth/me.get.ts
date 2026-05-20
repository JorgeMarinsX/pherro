export default defineEventHandler(async (event) => {
  const session = await readSession(event)
  if (!session) return { authenticated: false as const }
  return { authenticated: true as const, email: session.email }
})
