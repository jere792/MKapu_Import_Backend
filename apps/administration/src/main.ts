/* administration/src/main.ts */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AdministrationModule } from './administration.module';

async function bootstrap() {
  const app = await NestFactory.create(AdministrationModule);

  // Obtener ConfigService
  const configService = app.get(ConfigService);

  // Habilitar CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Obtener puerto desde .env
  const port = configService.get<number>('ADMINISTRATION_PORT') || 3002;

  await app.listen(port);
  console.log(
    `🏢 Administration Microservice corriendo en: http://localhost:${port}`,
  );
}
bootstrap();
