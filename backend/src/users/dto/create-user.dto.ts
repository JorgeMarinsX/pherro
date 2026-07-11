import { IsBoolean, IsEmail, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator'
import { UserRole } from '@prisma/client'
import { IsStrongPassword } from '../../auth/password-strength'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  password!: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
