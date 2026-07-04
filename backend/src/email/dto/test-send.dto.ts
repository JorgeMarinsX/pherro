import { IsEmail } from 'class-validator'

export class TestSendDto {
  @IsEmail()
  to!: string
}
