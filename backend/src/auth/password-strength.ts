import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import { adjacencyGraphs, dictionary as commonDictionary } from '@zxcvbn-ts/language-common'
import { dictionary as ptBrDictionary } from '@zxcvbn-ts/language-pt-br'
import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator'

zxcvbnOptions.setOptions({
  graphs: adjacencyGraphs,
  dictionary: { ...commonDictionary, ...ptBrDictionary },
})

export const MIN_PASSWORD_SCORE = 3

// Sibling DTO fields fed to zxcvbn so "senha = e-mail/slug/nome" scores as weak.
const CONTEXT_FIELDS = ['email', 'adminEmail', 'slug', 'name'] as const

export function isStrongPassword(password: string, userInputs: string[] = []): boolean {
  // Cap scoring input: zxcvbn cost grows with length, and 100 chars is past any
  // realistic passphrase — everything longer is already strong or garbage.
  return zxcvbn(password.slice(0, 100), userInputs).score >= MIN_PASSWORD_SCORE
}

export function IsStrongPassword(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isStrongPassword',
      target: target.constructor,
      propertyName: propertyName as string,
      options: {
        message: 'Senha muito fraca. Evite palavras comuns e dados pessoais; use uma frase longa ou misture letras, números e símbolos.',
        ...options,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return false
          const dto = args.object as Record<string, unknown>
          const context = CONTEXT_FIELDS.map((f) => dto[f]).filter(
            (v): v is string => typeof v === 'string' && v.length > 0,
          )
          return isStrongPassword(value, context)
        },
      },
    })
  }
}
