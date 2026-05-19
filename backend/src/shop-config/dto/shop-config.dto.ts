import { Expose, Type } from 'class-transformer'

export class WhatsappNumberDto {
  @Expose() id!: string
  @Expose() label!: string
  @Expose() number!: string
}

export class ShopConfigDto {
  @Expose() id!: string
  @Expose() shopName!: string
  @Expose() logoUrl!: string | null
  @Expose() description!: string | null
  @Expose() address!: string | null

  @Expose()
  @Type(() => WhatsappNumberDto)
  whatsappNumbers!: WhatsappNumberDto[]
}
