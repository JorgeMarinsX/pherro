import { IsOptional, IsString, Matches, MaxLength } from 'class-validator'

// Branding image URLs (logo/hero/favicon) are NOT patchable here — their
// lifecycle (store + delete old file) belongs to POST/DELETE /uploads/branding/:kind.
export class UpdateShopConfigDto {
  @IsOptional() @IsString() @MaxLength(120) shopName?: string
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Cor inválida. Use o formato #RRGGBB.' })
  primaryColor?: string | null
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null
  @IsOptional() @IsString() @MaxLength(300) address?: string | null
}
