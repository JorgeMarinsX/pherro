import { Expose, Type } from 'class-transformer'

export class LeadVehicleInterestDto {
  @Expose() id!: string
  @Expose() vehicleId!: string
  @Expose() notes!: string | null
  @Expose() createdAt!: Date
}

export class LeadDto {
  @Expose() id!: string
  @Expose() name!: string
  @Expose() phone!: string
  @Expose() email!: string | null
  @Expose() notes!: string | null
  @Expose() source!: string
  @Expose() createdAt!: Date
  @Expose() updatedAt!: Date

  @Expose()
  @Type(() => LeadVehicleInterestDto)
  vehicleInterests!: LeadVehicleInterestDto[]
}
