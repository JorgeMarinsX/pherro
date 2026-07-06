import { BadRequestException, Controller, Delete, Param, Post, Req } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { FastifyRequest } from 'fastify'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { BRANDING_KINDS, UploadsService, type BrandingKind } from './uploads.service'

function parseBrandingKind(kind: string): BrandingKind {
  if (!(BRANDING_KINDS as readonly string[]).includes(kind)) {
    throw new BadRequestException('Tipo de imagem inválido.')
  }
  return kind as BrandingKind
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post('vehicle-photos')
  @AdminOnly()
  async vehiclePhotos(@Req() req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Envie as imagens como multipart/form-data.')
    }
    return this.service.processVehiclePhotos(req)
  }

  @Post('branding/:kind')
  @AdminOnly()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async uploadBranding(@Param('kind') kind: string, @Req() req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Envie a imagem como multipart/form-data.')
    }
    return this.service.processBrandingImage(parseBrandingKind(kind), req)
  }

  @Delete('branding/:kind')
  @AdminOnly()
  async deleteBranding(@Param('kind') kind: string) {
    await this.service.removeBrandingImage(parseBrandingKind(kind))
    return { ok: true }
  }
}
