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
import { VehicleStatusInput } from './vehicle-status.enum'

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

  // Optional on create: form sends it (admin may create an INACTIVE draft), and
  // forbidNonWhitelisted would 400 on the extra field if it weren't whitelisted.
  // Omitted → Prisma schema default ACTIVE applies.
  @IsOptional() @IsEnum(VehicleStatusInput) status?: VehicleStatusInput

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
