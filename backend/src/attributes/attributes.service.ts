import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AttributeType, Prisma } from '@prisma/client'
import type { Cache } from 'cache-manager'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { TenantContext } from '../tenant/tenant-context'
import { AttributeDto } from './dto/attribute.dto'
import { CreateAttributeDto } from './dto/create-attribute.dto'
import { UpdateAttributeDto } from './dto/update-attribute.dto'

const listKey = () => `t:${TenantContext.tenantId() ?? 'none'}:attributes:list`
const TTL_MS = 60_000

@Injectable()
export class AttributesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async list(): Promise<AttributeDto[]> {
    const cached = await this.cache.get<AttributeDto[]>(listKey())
    if (cached) return cached

    const rows = await this.prisma.scoped.attributeDefinition.findMany({
      orderBy: { name: 'asc' },
    })
    const dto = plainToInstance(AttributeDto, rows, { excludeExtraneousValues: true })
    await this.cache.set(listKey(), dto, TTL_MS)
    return dto
  }

  async create(dto: CreateAttributeDto): Promise<AttributeDto> {
    this.assertEnumOptions(dto.type, dto.options)
    try {
      const created = await this.prisma.scoped.attributeDefinition.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          icon: dto.icon ?? null,
          type: dto.type,
          options: dto.options ?? Prisma.JsonNull,
        },
      })
      await this.invalidate()
      return plainToInstance(AttributeDto, created, { excludeExtraneousValues: true })
    } catch (e) {
      throw this.mapSlugConflict(e)
    }
  }

  async update(id: string, dto: UpdateAttributeDto): Promise<AttributeDto> {
    const existing = await this.prisma.scoped.attributeDefinition.findFirst({
      where: { id },
      select: { type: true },
    })
    if (!existing) throw new NotFoundException(`Attribute ${id} not found.`)

    const type = dto.type ?? existing.type
    if (dto.type !== undefined || dto.options !== undefined) {
      this.assertEnumOptions(type, dto.options)
    }

    const data: Prisma.AttributeDefinitionUpdateInput = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.slug !== undefined) data.slug = dto.slug
    if (dto.icon !== undefined) data.icon = dto.icon ?? null
    if (dto.type !== undefined) data.type = dto.type
    if (dto.options !== undefined) data.options = dto.options ?? Prisma.JsonNull

    try {
      const updated = await this.prisma.scoped.attributeDefinition.update({ where: { id }, data })
      await this.invalidate()
      return plainToInstance(AttributeDto, updated, { excludeExtraneousValues: true })
    } catch (e) {
      throw this.mapSlugConflict(e)
    }
  }

  async remove(id: string): Promise<{ ok: true }> {
    const existing = await this.prisma.scoped.attributeDefinition.findFirst({
      where: { id },
      select: { id: true },
    })
    if (!existing) throw new NotFoundException(`Attribute ${id} not found.`)

    const inUse = await this.prisma.scoped.vehicleAttribute.count({
      where: { attributeDefinitionId: id },
    })
    if (inUse > 0) throw new BadRequestException('Atributo em uso por veículos.')

    await this.prisma.scoped.attributeDefinition.delete({ where: { id } })
    await this.invalidate()
    return { ok: true }
  }

  private assertEnumOptions(type: AttributeType, options?: string[] | null) {
    if (type === AttributeType.ENUM && !options?.length) {
      throw new BadRequestException('Atributos do tipo lista exigem ao menos uma opção.')
    }
  }

  private mapSlugConflict(e: unknown): unknown {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('Slug já existe.')
    }
    return e
  }

  private async invalidate() {
    await this.cache.del(listKey())
  }
}
