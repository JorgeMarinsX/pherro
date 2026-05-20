import { Module } from '@nestjs/common'
import { AdminTokenGuard } from './guards/admin-token.guard'

@Module({
  providers: [AdminTokenGuard],
  exports: [AdminTokenGuard],
})
export class AuthModule {}
