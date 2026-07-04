import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator'

export class CreateTenantDto {
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
  adminPassword!: string

  // Billing document (CPF 11 / CNPJ 14 digits). Optional — required only to bill.
  @IsOptional()
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'CPF/CNPJ deve ter 11 ou 14 dígitos (apenas números)' })
  cpfCnpj?: string

  @IsOptional()
  @IsString()
  plan?: string
}
