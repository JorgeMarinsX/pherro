import { Expose } from 'class-transformer'
import type { EmailVariable } from '../../email/default-templates'

export class CampaignDto {
  @Expose() id!: string
  @Expose() name!: string
  @Expose() subject!: string
  @Expose() html!: string
  @Expose() status!: string
  @Expose() recipientCount!: number
  @Expose() sentCount!: number
  @Expose() failedCount!: number
  @Expose() sentAt!: Date | null
  @Expose() createdAt!: Date
  @Expose() updatedAt!: Date
  @Expose() variables!: EmailVariable[]
}
