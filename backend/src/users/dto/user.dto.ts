import { Exclude, Expose } from 'class-transformer'
import { UserRole } from '@prisma/client'

@Exclude()
export class UserDto {
  @Expose() id!: string
  @Expose() email!: string
  @Expose() role!: UserRole
  @Expose() isActive!: boolean
  @Expose() createdAt!: Date
  @Expose() updatedAt!: Date
  @Expose() lastLoginAt!: Date | null
}
