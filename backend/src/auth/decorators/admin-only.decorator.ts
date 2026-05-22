import { applyDecorators, UseGuards } from '@nestjs/common'
import { AdminOrTokenGuard } from '../guards/admin-or-token.guard'
import { ADMIN_ROLES } from '../roles'
import { Roles } from './roles.decorator'

export const AdminOnly = () =>
  applyDecorators(UseGuards(AdminOrTokenGuard), Roles(...ADMIN_ROLES))
