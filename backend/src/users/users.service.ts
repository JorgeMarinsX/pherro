import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as argon2 from 'argon2'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { DEFAULT_NEW_USER_ROLE } from '../auth/roles'
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

  // CRUD runs through the scoped client: tenantId is auto-injected from the
  // JWT-bound TenantContext, so email uniqueness/lookups are per-tenant.
  async create(dto: CreateUserDto): Promise<UserDto> {
    const email = dto.email.toLowerCase()
    const exists = await this.prisma.scoped.user.findFirst({ where: { email } })
    if (exists) throw new ConflictException('E-mail já cadastrado')
    const passwordHash = await UsersService.hash(dto.password)
    const user = await this.prisma.scoped.user.create({
      data: {
        email,
        passwordHash,
        role: dto.role ?? DEFAULT_NEW_USER_ROLE,
        isActive: dto.isActive ?? true,
      },
    })
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
  }

  async list(): Promise<UserDto[]> {
    const users = await this.prisma.scoped.user.findMany({ orderBy: { createdAt: 'desc' } })
    return users.map((u) => plainToInstance(UserDto, u, { excludeExtraneousValues: true }))
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.scoped.user.findFirst({ where: { id } })
    if (!user) throw new NotFoundException()
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
  }

  // Auth lookups: tenant User reads bypass the request-scoped extension (login
  // runs before tenant scoping is bound), so set the RLS GUC explicitly per tx.
  // isActive in the where: disabled account and unknown e-mail are the same no-row
  // path — no timing oracle between them.
  async findByEmailInTenant(email: string, tenantId: string) {
    return this.inTenant(tenantId, (tx) =>
      tx.user.findFirst({
        where: { tenantId, email: email.toLowerCase(), isActive: true },
      }),
    )
  }

  async findByIdInTenant(id: string, tenantId: string | null) {
    if (!tenantId) return null
    return this.inTenant(tenantId, (tx) =>
      tx.user.findFirst({ where: { id, tenantId } }),
    )
  }

  async findPlatformAdminByEmail(email: string) {
    const a = await this.prisma.platformAdmin.findFirst({
      where: { email: email.toLowerCase(), isActive: true },
    })
    return a ? this.asPlatformUser(a) : null
  }

  async findPlatformAdminById(id: string) {
    const a = await this.prisma.platformAdmin.findUnique({ where: { id } })
    return a ? this.asPlatformUser(a) : null
  }

  private asPlatformUser(a: {
    id: string
    email: string
    passwordHash: string
    isActive: boolean
  }) {
    return {
      id: a.id,
      email: a.email,
      passwordHash: a.passwordHash,
      isActive: a.isActive,
      role: 'PLATFORM_ADMIN' as const,
      tenantId: null,
    }
  }

  private async inTenant<T>(
    tenantId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`
      return fn(tx)
    })
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const existing = await this.prisma.scoped.user.findFirst({ where: { id } })
    if (!existing) throw new NotFoundException()

    const data: Record<string, unknown> = {}
    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const clash = await this.prisma.scoped.user.findFirst({
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

    const user = await this.prisma.scoped.user.update({ where: { id }, data })
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true })
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.scoped.user.findFirst({ where: { id } })
    if (!existing) throw new NotFoundException()
    await this.prisma.scoped.user.delete({ where: { id } })
  }

  // Reset-token path: no JWT context — GUC set explicitly, like the auth lookups.
  async updatePassword(id: string, tenantId: string, passwordHash: string): Promise<void> {
    await this.inTenant(tenantId, (tx) =>
      tx.user.update({ where: { id }, data: { passwordHash } }),
    )
  }

  // Tenant user: GUC set explicitly (login predates scoping). Best-effort.
  async touchLastLogin(id: string, tenantId: string): Promise<void> {
    await this.inTenant(tenantId, (tx) =>
      tx.user.update({ where: { id }, data: { lastLoginAt: new Date() } }),
    ).catch(() => {})
  }

  async touchPlatformAdminLastLogin(id: string): Promise<void> {
    await this.prisma.platformAdmin
      .update({ where: { id }, data: { lastLoginAt: new Date() } })
      .catch(() => {})
  }
}
