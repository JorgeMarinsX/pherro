import { IsString, Length } from 'class-validator'

export class CreateCampaignDto {
  @IsString()
  @Length(2, 120)
  name!: string
}
