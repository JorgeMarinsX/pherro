import { IsString, MaxLength, MinLength } from 'class-validator'
import { IsStrongPassword } from '../password-strength'

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  token!: string

  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword()
  password!: string
}
