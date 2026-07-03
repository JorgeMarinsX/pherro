import { DomainStatus, TenantStatus } from '@prisma/client'
import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class TenantDto {
  @Expose() id!: string
  @Expose() slug!: string
  @Expose() name!: string
  @Expose() customDomain!: string | null
  @Expose() domainStatus!: DomainStatus
  @Expose() plan!: string
  @Expose() status!: TenantStatus
  @Expose() createdAt!: Date
  @Expose() updatedAt!: Date
}
