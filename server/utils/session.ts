import type { H3Event } from 'h3'
import { isAuthRole, type AuthRole } from '~~/shared/roles'

const COOKIE_NAME = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export type AdminSession = {
  accessToken: string
  refreshToken: string
  email: string
  role: AuthRole
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!
  return diff === 0
}

async function importKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return b64urlEncode(new Uint8Array(sig))
}

function getSecret(event: H3Event): string {
  const secret = useRuntimeConfig(event).sessionSecret
  if (!secret || secret.length < 32) {
    throw createError({ statusCode: 500, statusMessage: 'SESSION_SECRET not configured' })
  }
  return secret
}

export async function writeSession(event: H3Event, session: AdminSession): Promise<void> {
  const secret = getSecret(event)
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify(session)))
  const signature = await sign(payload, secret)
  const value = `${payload}.${signature}`

  setCookie(event, COOKIE_NAME, value, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function readSession(event: H3Event): Promise<AdminSession | null> {
  const raw = getCookie(event, COOKIE_NAME)
  if (!raw) return null

  const dot = raw.indexOf('.')
  if (dot < 1) return null
  const payload = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  if (!payload || !signature) return null

  let secret: string
  try {
    secret = getSecret(event)
  } catch {
    return null
  }

  const expected = await sign(payload, secret)
  if (!timingSafeEqual(new TextEncoder().encode(signature), new TextEncoder().encode(expected))) {
    return null
  }

  try {
    const json = new TextDecoder().decode(b64urlDecode(payload))
    const session = JSON.parse(json) as AdminSession
    if (
      typeof session.accessToken !== 'string' ||
      typeof session.refreshToken !== 'string' ||
      typeof session.email !== 'string' ||
      !isAuthRole(session.role)
    ) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSession(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export async function requireSession(event: H3Event): Promise<AdminSession> {
  const session = await readSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session
}
