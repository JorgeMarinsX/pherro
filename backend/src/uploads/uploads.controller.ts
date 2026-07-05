import { BadRequestException, Controller, Post, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AdminOnly } from '../auth/decorators/admin-only.decorator'
import { UploadsService } from './uploads.service'

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
}
