import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateShopConfigDto {
  @IsOptional() @IsString() @MaxLength(120) shopName?: string
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string | null
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null
  @IsOptional() @IsString() @MaxLength(300) address?: string | null
}
