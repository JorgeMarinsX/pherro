import { Expose, Type } from 'class-transformer'

export class WhatsappNumberDto {
  @Expose() id!: string
  @Expose() label!: string
  @Expose() description!: string | null
  @Expose() number!: string
  @Expose() isActive!: boolean
}

export class ShopConfigDto {
  @Expose() id!: string
  @Expose() shopName!: string
  @Expose() logoUrl!: string | null
  @Expose() heroImageUrl!: string | null
  @Expose() faviconUrl!: string | null
  @Expose() primaryColor!: string | null
  @Expose() description!: string | null
  @Expose() address!: string | null

  @Expose()
  @Type(() => WhatsappNumberDto)
  whatsappNumbers!: WhatsappNumberDto[]
}
