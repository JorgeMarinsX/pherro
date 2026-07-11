import { backendFetch } from '~~/server/utils/backend'

// Public storefront lead capture (WhatsApp gate). Fields are picked explicitly
// so the public form can never set source=MANUAL or smuggle extra payload.
export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const vehicleId = typeof body?.vehicleId === 'string' && body.vehicleId ? body.vehicleId : null

  return await backendFetch(event, '/leads', {
    method: 'POST',
    body: {
      name: body?.name,
      phone: body?.phone,
      email: body?.email || undefined,
      source: 'FORM',
      vehicleInterests: vehicleId ? [{ vehicleId }] : undefined,
    },
  })
})
