import type { ConfigService } from '@nestjs/config'
import type { JwtModuleOptions } from '@nestjs/jwt'

export const JWT_ISSUER = 'pherro'
export const JWT_AUDIENCE = 'pherro-backend'

// Single source for every JwtModule registration: tokens signed elsewhere (or with
// foreign iss/aud) fail verification even if the secret leaks or gets reused.
export function jwtModuleOptions(config: ConfigService): JwtModuleOptions {
  const secret = config.get<string>('JWT_SECRET')
  if (!secret) throw new Error('JWT_SECRET not configured')
  return {
    secret,
    signOptions: { algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
    verifyOptions: { algorithms: ['HS256'], issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
  }
}
