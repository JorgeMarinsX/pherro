import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { LeadSourceDto } from './create-lead.dto'

export class ListLeadsDto {
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsEnum(LeadSourceDto) source?: LeadSourceDto

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) take?: number = 50
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number = 0
}
