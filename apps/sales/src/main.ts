/* apps/sales/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { SalesModule } from './sales.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(SalesModule);

  // 1. CAMBIO IMPORTANTE: Usar un puerto diferente para TCP (ej. 3012)
  // El 3002 ya lo usa tu servicio de Admin en el .env
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3012, // <--- CAMBIADO de 3002 a 3012 para evitar choque
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

  // 2. Puerto HTTP en 3003 (Coincide con tu SALES_SERVICE_URL del .env)
  await app.listen(3003);

  console.log(
    `💰 Sales Microservice corriendo en: http://localhost:3003 (TCP interno: 3012)`,
  );
}

bootstrap();
