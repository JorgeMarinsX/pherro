import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as argon2 from 'argon2'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserDto } from './dto/user.dto'

const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  static hash(pw: string): Promise<string> {
    return argon2.hash(pw, ARGON_OPTS)
  }

  static verify(hash: string, pw: string): Promise<boolean> {
    return argon2.verify(hash, pw, ARGON_OPTS).catch(() => false)
  }

  async create(dto: CreateUserDto): Promise<UserDto> {
    const email = dto.email.toLowerCase()
    const exists = await this.prisma.user.findUnique({ where: { email } })
    if (exists) throw new ConflictException('E-mail já cadastrado')
    const passwordHash = await UsersService.hash(dto.password)
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: dto.role ?? 'STAFF',
        isActive: dto.isActive ?? true,
      },
    })
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
  }

  async list(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return users.map((u) => plainToInstance(UserDto, u, { excludeExtraneousValues: true }))
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException()
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException()

    const data: Record<string, unknown> = {}
    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      })
      if (clash) throw new ConflictException('E-mail já cadastrado')
      data.email = dto.email.toLowerCase()
    }
    if (dto.password) data.passwordHash = await UsersService.hash(dto.password)
    if (dto.role !== undefined) data.role = dto.role
    if (dto.isActive !== undefined) data.isActive = dto.isActive

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nada para atualizar')
    }

    const user = await this.prisma.user.update({ where: { id }, data })
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException()
    await this.prisma.user.delete({ where: { id } })
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.prisma.user
      .update({ where: { id }, data: { lastLoginAt: new Date() } })
      .catch(() => {})
  }
}
