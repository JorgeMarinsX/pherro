import { PartialType } from '@nestjs/mapped-types'
import { CreateVehicleDto } from './create-vehicle.dto'

// status already optional on CreateVehicleDto; PartialType keeps it optional here.
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
