import { Expose } from 'class-transformer'
import type { EmailVariable } from '../default-templates'

export class EmailTemplateDto {
  @Expose() key!: string
  @Expose() name!: string
  @Expose() description!: string
  @Expose() subject!: string
  @Expose() html!: string
  @Expose() isActive!: boolean
  @Expose() updatedAt!: Date
  @Expose() variables!: EmailVariable[]
}
