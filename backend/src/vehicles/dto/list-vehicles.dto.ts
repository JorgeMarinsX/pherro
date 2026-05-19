import { Type } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'

export enum VehicleSort {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  YEAR_DESC = 'year_desc',
  MILEAGE_ASC = 'mileage_asc',
}

export enum VehicleStatusFilter {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ALL = 'ALL',
}

export enum TransmissionFilter {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  CVT = 'CVT',
}

export enum FuelTypeFilter {
  FLEX = 'FLEX',
  GASOLINE = 'GASOLINE',
  ETHANOL = 'ETHANOL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
}

export class ListVehiclesDto {
  @IsOptional() @IsString() make?: string
  @IsOptional() @IsString() model?: string
  @IsOptional() @IsString() color?: string

  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) yearMin?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) yearMax?: number

  @IsOptional() @Type(() => Number) @Min(0) priceMin?: number
  @IsOptional() @Type(() => Number) @Min(0) priceMax?: number

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) mileageMax?: number

  @IsOptional() @IsEnum(TransmissionFilter) transmission?: TransmissionFilter
  @IsOptional() @IsEnum(FuelTypeFilter) fuelType?: FuelTypeFilter
  @IsOptional() @IsEnum(VehicleStatusFilter) status?: VehicleStatusFilter

  @IsOptional() @IsEnum(VehicleSort) sort?: VehicleSort = VehicleSort.NEWEST

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) take?: number = 24
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number = 0
}
