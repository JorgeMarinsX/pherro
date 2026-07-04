import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { EmailTemplatesController } from './email-templates.controller'
import { EmailTemplatesService } from './email-templates.service'
import { ResendService } from './resend.service'

@Module({
  imports: [PrismaModule],
  controllers: [EmailTemplatesController],
  providers: [ResendService, EmailTemplatesService],
  exports: [ResendService, EmailTemplatesService],
})
export class EmailModule {}
