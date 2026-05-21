import { applyDecorators, UseGuards } from '@nestjs/common'
import { AdminOrTokenGuard } from '../guards/admin-or-token.guard'
import { Roles } from './roles.decorator'

export const AdminOnly = () =>
  applyDecorators(UseGuards(AdminOrTokenGuard), Roles('ADMIN', 'SUPERUSER'))
