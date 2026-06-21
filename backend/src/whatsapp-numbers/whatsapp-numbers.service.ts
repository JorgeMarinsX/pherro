import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Cache } from 'cache-manager'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWhatsappNumberDto } from './dto/create-whatsapp-number.dto'
import { UpdateWhatsappNumberDto } from './dto/update-whatsapp-number.dto'
import { WhatsappNumberDto } from './dto/whatsapp-number.dto'

const LIST_KEY = 'whatsapp:list'
const ACTIVE_KEY = 'whatsapp:active'
// ShopConfig nests whatsappNumbers — bust it too on any mutation.
const SHOP_CONFIG_KEY = 'shop-config:current'
const TTL_MS = 60_000

@Injectable()
export class WhatsappNumbersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async list(): Promise<WhatsappNumberDto[]> {
    const cached = await this.cache.get<WhatsappNumberDto[]>(LIST_KEY)
    if (cached) return cached

    const rows = await this.prisma.whatsappNumber.findMany({
      orderBy: { createdAt: 'asc' },
    })
    const dto = plainToInstance(WhatsappNumberDto, rows, { excludeExtraneousValues: true })
    await this.cache.set(LIST_KEY, dto, TTL_MS)
    return dto
  }

  // Single source of truth for the storefront WhatsApp URL helper.
  async getActive(): Promise<WhatsappNumberDto | null> {
    const cached = await this.cache.get<WhatsappNumberDto | null>(ACTIVE_KEY)
    if (cached !== undefined) return cached

    const row = await this.prisma.whatsappNumber.findFirst({ where: { isActive: true } })
    const dto = row
      ? plainToInstance(WhatsappNumberDto, row, { excludeExtraneousValues: true })
      : null
    await this.cache.set(ACTIVE_KEY, dto, TTL_MS)
    return dto
  }

  async create(dto: CreateWhatsappNumberDto): Promise<WhatsappNumberDto> {
    const shop = await this.prisma.shopConfig.findFirst({ select: { id: true } })
    if (!shop) throw new NotFoundException('ShopConfig not seeded.')

    const count = await this.prisma.whatsappNumber.count({ where: { shopConfigId: shop.id } })
    // First-ever number is auto-active; otherwise honor explicit isActive flag.
    const makeActive = count === 0 || dto.isActive === true

    const created = await this.prisma.$transaction(async (tx) => {
      if (makeActive) {
        await tx.whatsappNumber.updateMany({
          where: { shopConfigId: shop.id, isActive: true },
          data: { isActive: false },
        })
      }
      return tx.whatsappNumber.create({
        data: {
          label: dto.label,
          description: dto.description ?? null,
          number: dto.number,
          isActive: makeActive,
          shopConfigId: shop.id,
        },
      })
    })

    await this.invalidate()
    return plainToInstance(WhatsappNumberDto, created, { excludeExtraneousValues: true })
  }

  async update(id: string, dto: UpdateWhatsappNumberDto): Promise<WhatsappNumberDto> {
    const existing = await this.prisma.whatsappNumber.findUnique({
      where: { id },
      select: { id: true, shopConfigId: true },
    })
    if (!existing) throw new NotFoundException(`WhatsappNumber ${id} not found.`)

    const data: Prisma.WhatsappNumberUpdateInput = {}
    if (dto.label !== undefined) data.label = dto.label
    if (dto.description !== undefined) data.description = dto.description ?? null
    if (dto.number !== undefined) data.number = dto.number

    const updated = await this.prisma.$transaction(async (tx) => {
      // Setting active here enforces single-active: unset siblings first.
      if (dto.isActive === true) {
        await tx.whatsappNumber.updateMany({
          where: { shopConfigId: existing.shopConfigId, isActive: true, id: { not: id } },
          data: { isActive: false },
        })
        data.isActive = true
      } else if (dto.isActive === false) {
        // Refuse to leave the shop with zero active numbers via a plain patch.
        // Use activate(otherId) to switch the active number instead.
        throw new BadRequestException(
          'Não é possível desativar diretamente. Defina outro número como ativo.',
        )
      }
      return tx.whatsappNumber.update({ where: { id }, data })
    })

    await this.invalidate()
    return plainToInstance(WhatsappNumberDto, updated, { excludeExtraneousValues: true })
  }

  async activate(id: string): Promise<WhatsappNumberDto> {
    const existing = await this.prisma.whatsappNumber.findUnique({
      where: { id },
      select: { id: true, shopConfigId: true },
    })
    if (!existing) throw new NotFoundException(`WhatsappNumber ${id} not found.`)

    const [, activated] = await this.prisma.$transaction([
      this.prisma.whatsappNumber.updateMany({
        where: { shopConfigId: existing.shopConfigId, isActive: true, id: { not: id } },
        data: { isActive: false },
      }),
      this.prisma.whatsappNumber.update({ where: { id }, data: { isActive: true } }),
    ])

    await this.invalidate()
    return plainToInstance(WhatsappNumberDto, activated, { excludeExtraneousValues: true })
  }

  async remove(id: string): Promise<{ ok: true }> {
    const existing = await this.prisma.whatsappNumber.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    })
    if (!existing) throw new NotFoundException(`WhatsappNumber ${id} not found.`)

    // Block deleting the active number — force activate-another first.
    if (existing.isActive) {
      throw new BadRequestException(
        'Defina outro número como ativo antes de remover este.',
      )
    }

    await this.prisma.whatsappNumber.delete({ where: { id } })
    await this.invalidate()
    return { ok: true }
  }

  private async invalidate() {
    await Promise.all([
      this.cache.del(LIST_KEY),
      this.cache.del(ACTIVE_KEY),
      this.cache.del(SHOP_CONFIG_KEY),
    ])
  }
}
