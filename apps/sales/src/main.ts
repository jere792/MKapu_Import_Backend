/* sales/src/main.ts */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SalesModule } from './sales.module';

async function bootstrap() {
  const app = await NestFactory.create(SalesModule);

  // Obtener ConfigService
  const configService = app.get(ConfigService);

  // Habilitar CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Obtener puerto desde .env
  const port = configService.get<number>('SALES_PORT') || 3004;

  await app.listen(port);
  console.log(`💰 Sales Microservice corriendo en: http://localhost:${port}`);
}

bootstrap();
