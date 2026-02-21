/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* apps/sales/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { SalesModule } from './sales.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(SalesModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3003;
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3012,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.startAllMicroservices();

  await app.listen(port);

  console.log(
    `💰 Sales Microservice corriendo en: http://localhost:${port} (TCP interno: 3012)`,
  );
}

bootstrap();
