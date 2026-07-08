import { IsString, MinLength } from 'class-validator'

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  token!: string

  @MinLength(8)
  password!: string
}
