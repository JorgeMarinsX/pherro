import { IsIn, IsString } from 'class-validator'
import { PAID_PLAN_IDS } from '../plans'

export class SubscribeDto {
  @IsString()
  @IsIn(PAID_PLAN_IDS as unknown as string[], { message: 'Plano inválido' })
  planId!: string
}
