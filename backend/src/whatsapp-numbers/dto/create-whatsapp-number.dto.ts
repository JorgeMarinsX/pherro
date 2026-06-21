import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class CreateWhatsappNumberDto {
  @IsString() @MaxLength(60) label!: string

  @IsOptional() @IsString() @MaxLength(200) description?: string | null

  // Stored raw (any human format). Allow digits, spaces, +, -, (), .
  @IsString()
  @MaxLength(30)
  @Matches(/^[0-9+\-().\s]+$/, { message: 'number must contain only digits and phone punctuation' })
  number!: string

  @IsOptional() @IsBoolean() isActive?: boolean
}
