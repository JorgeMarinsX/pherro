// Build an api.whatsapp.com send URL. `number` = raw stored number (any format);
// `message` = pt-BR context message for this surface. Digits-only phone.
// Auto-imported by Nuxt from app/utils.
export function buildWhatsappUrl(number: string, message: string): string {
  const phone = number.replace(/\D/g, '')
  const text = encodeURIComponent(message)
  return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`
}
