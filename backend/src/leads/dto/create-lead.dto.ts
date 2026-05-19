import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

export enum LeadSourceDto {
  MANUAL = 'MANUAL',
  FORM = 'FORM',
}

export class CreateLeadVehicleInterestDto {
  @IsString() vehicleId!: string
  @IsOptional() @IsString() @MaxLength(500) notes?: string
}

export class CreateLeadDto {
  @IsString() @MaxLength(120) name!: string
  @IsString() @MaxLength(40) phone!: string
  @IsOptional() @IsEmail() @MaxLength(200) email?: string
  @IsOptional() @IsString() @MaxLength(2000) notes?: string

  @IsOptional() @IsEnum(LeadSourceDto) source?: LeadSourceDto = LeadSourceDto.FORM

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateLeadVehicleInterestDto)
  vehicleInterests?: CreateLeadVehicleInterestDto[]
}
