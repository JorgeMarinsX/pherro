import { PartialType } from '@nestjs/mapped-types'
import { IsEnum, IsOptional } from 'class-validator'
import { CreateVehicleDto } from './create-vehicle.dto'

export enum VehicleStatusUpdate {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsOptional() @IsEnum(VehicleStatusUpdate) status?: VehicleStatusUpdate
}
