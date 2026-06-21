import { Expose, Type } from 'class-transformer'

export class VehiclePhotoDto {
  @Expose() id!: string
  @Expose() url!: string
  @Expose() position!: number
}

export class VehicleWhatsappDto {
  @Expose() id!: string
  @Expose() label!: string
  @Expose() number!: string
}

export class AttributeDefinitionDto {
  @Expose() id!: string
  @Expose() name!: string
  @Expose() slug!: string
  @Expose() icon!: string | null
  @Expose() type!: string
}

export class VehicleAttributeDto {
  @Expose() value!: string

  @Expose()
  @Type(() => AttributeDefinitionDto)
  attributeDefinition!: AttributeDefinitionDto
}

export class VehicleListItemDto {
  @Expose() id!: string
  @Expose() slug!: string
  @Expose() make!: string
  @Expose() model!: string
  @Expose() year!: number

  @Expose() price!: number

  @Expose() mileage!: number
  @Expose() color!: string
  @Expose() transmission!: string
  @Expose() fuelType!: string
  @Expose() status!: string

  @Expose()
  @Type(() => VehiclePhotoDto)
  photos!: VehiclePhotoDto[]
}

export class VehicleDetailDto extends VehicleListItemDto {
  @Expose() description!: string | null

  @Expose()
  @Type(() => VehicleWhatsappDto)
  whatsappNumber!: VehicleWhatsappDto | null

  @Expose()
  @Type(() => VehicleAttributeDto)
  attributes!: VehicleAttributeDto[]
}
