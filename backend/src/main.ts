import 'reflect-metadata'
import { mkdir } from 'node:fs/promises'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { uploadsRootDir } from './storage/local-disk.storage'
import { MAX_FILE_BYTES, MAX_FILES_PER_REQUEST } from './uploads/uploads.service'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
  )

  await app.register(multipart, {
    limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES_PER_REQUEST, fields: 5 },
  })

  // Local-disk driver only: serve processed photos. Keys are content-addressed
  // (UUID per upload, never rewritten) so responses are immutable-cacheable.
  const uploadsDir = uploadsRootDir()
  await mkdir(uploadsDir, { recursive: true })
  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    maxAge: '365d',
    immutable: true,
  })

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Admin-Token', 'Authorization'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port, '0.0.0.0')
  console.log(`[backend] fastify listening on http://0.0.0.0:${port}`)
}

bootstrap()
