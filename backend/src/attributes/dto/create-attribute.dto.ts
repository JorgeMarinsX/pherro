import { AttributeType } from '@prisma/client'
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator'

export class CreateAttributeDto {
  @IsString() @MaxLength(60) name!: string

  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be kebab-case (a-z, 0-9, -)' })
  slug!: string

  // Server-side allowlist: only bundled Lucide icons are accepted.
  @IsOptional()
  @IsString()
  @Matches(/^i-lucide-[a-z0-9-]+$/, { message: 'icon must be an i-lucide-* name' })
  icon?: string | null

  @IsEnum(AttributeType) type!: AttributeType

  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[]
}
