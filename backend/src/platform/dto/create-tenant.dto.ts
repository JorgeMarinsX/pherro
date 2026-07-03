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

  @IsOptional()
  @IsString()
  plan?: string
}
