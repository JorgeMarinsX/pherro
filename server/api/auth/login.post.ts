import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.safeParse)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Credenciais inválidas' })
  }

  const config = useRuntimeConfig(event)
  const expectedEmail = config.adminEmail
  const expectedPassword = config.adminPassword

  if (!expectedEmail || !expectedPassword) {
    throw createError({ statusCode: 500, statusMessage: 'Admin credentials not configured' })
  }

  const emailMatch = body.data.email.toLowerCase() === String(expectedEmail).toLowerCase()
  const passwordBuf = new TextEncoder().encode(body.data.password)
  const expectedBuf = new TextEncoder().encode(String(expectedPassword))
  let passwordMatch = passwordBuf.length === expectedBuf.length
  let diff = passwordBuf.length ^ expectedBuf.length
  const len = Math.max(passwordBuf.length, expectedBuf.length)
  for (let i = 0; i < len; i++) {
    diff |= (passwordBuf[i] ?? 0) ^ (expectedBuf[i] ?? 0)
  }
  passwordMatch = passwordMatch && diff === 0

  if (!emailMatch || !passwordMatch) {
    throw createError({ statusCode: 401, statusMessage: 'E-mail ou senha incorretos' })
  }

  await createSession(event, body.data.email.toLowerCase())
  return { ok: true, email: body.data.email.toLowerCase() }
})
