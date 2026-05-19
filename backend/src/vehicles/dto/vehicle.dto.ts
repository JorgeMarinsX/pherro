import { Expose, Transform, Type } from 'class-transformer'

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

export class VehicleAttributeDto {
  @Expose() attributeDefinitionId!: string
  @Expose() value!: string
}

export class VehicleListItemDto {
  @Expose() id!: string
  @Expose() make!: string
  @Expose() model!: string
  @Expose() year!: number

  @Expose()
  @Transform(({ value }) => (value == null ? null : value.toString()), { toPlainOnly: true })
  price!: string

  @Expose() mileage!: number
  @Expose() color!: string
  @Expose() transmission!: string
  @Expose() fuelType!: string
  @Expose() status!: string

  @Expose()
  @Type(() => VehiclePhotoDto)
  @Transform(({ value }) => (Array.isArray(value) ? value.slice(0, 1) : []), { toPlainOnly: true })
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
