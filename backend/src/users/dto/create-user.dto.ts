import { IsBoolean, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator'
import { UserRole } from '@prisma/client'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @MinLength(8)
  password!: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
