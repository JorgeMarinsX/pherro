import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { FuelTypeFilter, TransmissionFilter } from './list-vehicles.dto'

export class CreateVehiclePhotoDto {
  @IsString() @MaxLength(1000) url!: string
  @IsInt() @Min(0) position!: number
}

export class CreateVehicleAttributeDto {
  @IsString() attributeDefinitionId!: string
  @IsString() @MaxLength(500) value!: string
}

export class CreateVehicleDto {
  @IsString() @MaxLength(60) make!: string
  @IsString() @MaxLength(80) model!: string
  @IsInt() @Min(1900) @Max(2100) year!: number
  @IsInt() @Min(0) price!: number
  @IsInt() @Min(0) mileage!: number
  @IsString() @MaxLength(40) color!: string

  @IsOptional() @IsString() @MaxLength(5000) description?: string | null

  @IsEnum(TransmissionFilter) transmission!: TransmissionFilter
  @IsEnum(FuelTypeFilter) fuelType!: FuelTypeFilter

  @IsOptional() @IsString() whatsappNumberId?: string | null

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CreateVehiclePhotoDto)
  photos?: CreateVehiclePhotoDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleAttributeDto)
  attributes?: CreateVehicleAttributeDto[]
}
