import 'reflect-metadata'
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
  )

  app.enableCors()

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
