import { Expose } from 'class-transformer'

export class WhatsappNumberDto {
  @Expose() id!: string
  @Expose() label!: string
  @Expose() description!: string | null
  @Expose() number!: string
  @Expose() isActive!: boolean
}
