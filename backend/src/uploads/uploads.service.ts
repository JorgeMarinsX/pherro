import { BadRequestException, Injectable, Logger, PayloadTooLargeException } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { ShopConfigService, type BrandingField } from '../shop-config/shop-config.service'
import { ObjectStorage } from '../storage/object-storage'
import { TenantContext } from '../tenant/tenant-context'

export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES_PER_REQUEST = 10

export const BRANDING_KINDS = ['logo', 'hero', 'favicon'] as const
export type BrandingKind = (typeof BRANDING_KINDS)[number]

// Per-kind output spec. Logo keeps alpha (webp); favicon is a small square PNG
// so browsers without webp-favicon support still render it.
const BRANDING_SPECS: Record<
  BrandingKind,
  { field: BrandingField; maxEdge: number; fit: 'inside' | 'cover'; format: 'webp' | 'png'; quality?: number }
> = {
  logo: { field: 'logoUrl', maxEdge: 512, fit: 'inside', format: 'webp', quality: 90 },
  hero: { field: 'heroImageUrl', maxEdge: 1920, fit: 'inside', format: 'webp', quality: 80 },
  favicon: { field: 'faviconUrl', maxEdge: 64, fit: 'cover', format: 'png' },
}

// Decode bomb guard: 50 MP is well past any phone camera.
const MAX_INPUT_PIXELS = 50_000_000
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif'])
const MAIN_MAX_EDGE = 1600
const THUMB_MAX_EDGE = 640

export interface UploadedPhotoDto {
  url: string
  thumbUrl: string
  width: number
  height: number
  bytes: number
}

// libvips does the pixel work off the event loop, so uploads never block other
// requests. This semaphore only caps how many transforms run at once so an
// upload burst can't saturate CPU/RAM for everyone else.
class Semaphore {
  private active = 0
  private readonly queue: (() => void)[] = []
  constructor(private readonly max: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max || this.queue.length > 0) {
      await new Promise<void>((resolve) => this.queue.push(resolve))
    }
    this.active++
    try {
      return await fn()
    } finally {
      this.active--
      this.queue.shift()?.()
    }
  }
}

const transformSlots = new Semaphore(
  Number(process.env.UPLOAD_TRANSFORM_CONCURRENCY ?? 4),
)

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name)

  constructor(
    private readonly storage: ObjectStorage,
    private readonly shopConfig: ShopConfigService,
  ) {}

  async processBrandingImage(kind: BrandingKind, req: FastifyRequest): Promise<{ url: string }> {
    const tenantId = TenantContext.tenantId()
    if (!tenantId) throw new BadRequestException('Tenant não identificado.')
    const spec = BRANDING_SPECS[kind]

    let input: Buffer | null = null
    for await (const part of req.parts()) {
      if (part.type !== 'file') continue
      input = await part.toBuffer().catch(() => {
        throw new PayloadTooLargeException('A imagem deve ter no máximo 10 MB.')
      })
      if (part.file.truncated) {
        throw new PayloadTooLargeException('A imagem deve ter no máximo 10 MB.')
      }
      break
    }
    if (!input) throw new BadRequestException('Nenhuma imagem enviada.')

    const buffer = input
    const url = await transformSlots.run(async () => {
      await this.assertValidImage(buffer)

      const base = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .resize({
          width: spec.maxEdge,
          height: spec.maxEdge,
          fit: spec.fit,
          withoutEnlargement: spec.fit === 'inside',
        })
      const out =
        spec.format === 'png'
          ? await base.png().toBuffer({ resolveWithObject: true })
          : await base.webp({ quality: spec.quality }).toBuffer({ resolveWithObject: true })

      const key = `branding/${tenantId}/${kind}-${randomUUID()}.${spec.format}`
      await this.storage.put(key, out.data, `image/${spec.format}`)
      this.logger.log(
        `branding ${kind} stored tenant=${tenantId} ${out.info.width}x${out.info.height} ${Math.round(out.data.length / 1024)}KB`,
      )
      return this.storage.publicUrl(key)
    })

    await this.replaceBrandingUrl(spec.field, url)
    return { url }
  }

  async removeBrandingImage(kind: BrandingKind): Promise<void> {
    await this.replaceBrandingUrl(BRANDING_SPECS[kind].field, null)
  }

  // Persist first, then delete the replaced file — a failed persist must not
  // leave the config pointing at a deleted object.
  private async replaceBrandingUrl(field: BrandingField, url: string | null) {
    const previousUrl = await this.shopConfig.setBrandingUrl(field, url)
    if (previousUrl && previousUrl !== url) {
      const oldKey = this.storage.keyFromUrl(previousUrl)
      if (oldKey) await this.storage.delete(oldKey)
    }
  }

  private async assertValidImage(input: Buffer): Promise<void> {
    // Format sniffed from magic bytes — client mimetype is untrusted.
    let meta: sharp.Metadata
    try {
      meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()
    } catch {
      throw new BadRequestException('Arquivo não é uma imagem válida.')
    }
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
      throw new BadRequestException('Formato não suportado. Use JPG, PNG, WebP ou AVIF.')
    }
  }

  async processVehiclePhotos(req: FastifyRequest): Promise<UploadedPhotoDto[]> {
    const tenantId = TenantContext.tenantId()
    if (!tenantId) throw new BadRequestException('Tenant não identificado.')

    const results: UploadedPhotoDto[] = []
    for await (const part of req.parts()) {
      if (part.type !== 'file') continue
      const buffer = await part.toBuffer().catch(() => {
        throw new PayloadTooLargeException('Cada imagem deve ter no máximo 10 MB.')
      })
      if (part.file.truncated) {
        throw new PayloadTooLargeException('Cada imagem deve ter no máximo 10 MB.')
      }
      results.push(await transformSlots.run(() => this.transformAndStore(tenantId, buffer)))
    }

    if (!results.length) throw new BadRequestException('Nenhuma imagem enviada.')
    return results
  }

  private async transformAndStore(tenantId: string, input: Buffer): Promise<UploadedPhotoDto> {
    await this.assertValidImage(input)

    const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate()
    const [main, thumb] = await Promise.all([
      base
        .clone()
        .resize({ width: MAIN_MAX_EDGE, height: MAIN_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true }),
      base
        .clone()
        .resize({ width: THUMB_MAX_EDGE, height: THUMB_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer({ resolveWithObject: true }),
    ])

    const id = randomUUID()
    const mainKey = `vehicle-photos/${tenantId}/${id}.webp`
    const thumbKey = `vehicle-photos/${tenantId}/${id}.thumb.webp`
    await this.storage.put(mainKey, main.data, 'image/webp')
    try {
      await this.storage.put(thumbKey, thumb.data, 'image/webp')
    } catch (e) {
      await this.storage.delete(mainKey)
      throw e
    }

    this.logger.log(
      `photo stored tenant=${tenantId} ${main.info.width}x${main.info.height} ${Math.round(main.data.length / 1024)}KB`,
    )

    return {
      url: this.storage.publicUrl(mainKey),
      thumbUrl: this.storage.publicUrl(thumbKey),
      width: main.info.width,
      height: main.info.height,
      bytes: main.data.length,
    }
  }
}
