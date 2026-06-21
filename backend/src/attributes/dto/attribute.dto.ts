import { Expose } from 'class-transformer'
import { AttributeType } from '@prisma/client'

export class AttributeDto {
  @Expose() id!: string
  @Expose() name!: string
  @Expose() slug!: string
  @Expose() icon!: string | null
  @Expose() type!: AttributeType
  @Expose() options!: string[] | null
}
