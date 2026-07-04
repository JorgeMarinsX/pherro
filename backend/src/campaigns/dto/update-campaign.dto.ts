import { IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  html?: string
}
