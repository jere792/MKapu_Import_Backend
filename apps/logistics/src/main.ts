/* logistics/src/main.ts */
import 'reflect-metadata';  
import { NestFactory } from '@nestjs/core';
import { LogisticsModule } from './logistics.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Creamos la aplicación
  const app = await NestFactory.create(LogisticsModule);

  // 1. TCP en puerto 3004 (Ventas lo busca aquí, NO CAMBIAR)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0', // Cambiado a 0.0.0.0 para mejor compatibilidad
      port: 3004,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.startAllMicroservices();

  // 2. CAMBIO CRÍTICO: HTTP en puerto 3005
  // Antes chocaba con el TCP en 3004
  await app.listen(3005);

  console.log(
    `📦 Logistics Microservice corriendo en HTTP: http://localhost:3005`,
  );
  console.log(`📦 Logistics TCP escuchando en port: 3004`);
}

bootstrap();
