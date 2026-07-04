import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @Length(1, 300)
  subject?: string

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  html?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
