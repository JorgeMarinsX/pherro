import { applyDecorators, UseGuards } from '@nestjs/common'
import { AdminTokenGuard } from '../guards/admin-token.guard'

export const AdminOnly = () => applyDecorators(UseGuards(AdminTokenGuard))
