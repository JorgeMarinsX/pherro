import { backendFetch } from '~~/server/utils/backend'

// Public: storefront reads the single active WhatsApp number for CTA URLs.
// Backend route is @Public(), so no bearer/admin token needed.
export default defineEventHandler(async (event) => {
  return await backendFetch(event, '/whatsapp-numbers/active')
})
