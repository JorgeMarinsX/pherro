import { TenantStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString, Length } from 'class-validator'

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string

  @IsOptional()
  @IsString()
  plan?: string

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus
}
