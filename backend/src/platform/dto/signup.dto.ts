import { Equals, IsEmail, IsIn, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator'
import { IsStrongPassword } from '../../auth/password-strength'
import { PAID_PLAN_IDS } from '../../billing/plans'

// Self-service signup: paid plans only. A store is provisioned PENDING_PAYMENT and goes
// live once the first invoice is paid (webhook). CPF/CNPJ is mandatory to bill.
export class SignupDto {
  // DNS-label safe: lowercase alnum + inner hyphens (→ <slug>.APP_BASE_DOMAIN).
  @IsString()
  @Length(3, 63)
  @Matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug!: string

  @IsString()
  @Length(2, 120)
  name!: string

  @IsEmail()
  adminEmail!: string

  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  adminPassword!: string

  // Billing document (CPF 11 / CNPJ 14 digits) — required: every signup is billed.
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'CPF/CNPJ deve ter 11 ou 14 dígitos (apenas números)' })
  cpfCnpj!: string

  // Chosen paid plan — no free tier on self-signup.
  @IsIn(PAID_PLAN_IDS as unknown as string[], { message: 'Escolha um plano válido' })
  plan!: string

  // LGPD: explicit acceptance of the Termos de Uso + Política de Privacidade.
  @Equals(true, { message: 'É preciso aceitar os Termos de Uso e a Política de Privacidade' })
  termsAccepted!: boolean
}
