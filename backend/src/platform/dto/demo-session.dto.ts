import { IsOptional, IsString, MaxLength } from 'class-validator'

export class DemoSessionDto {
  // Existing demo tenant to re-attach to (from the BFF's signed cookie).
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tenantId?: string
}
