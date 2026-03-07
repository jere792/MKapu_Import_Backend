import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { LogisticsModule } from './logistics.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(LogisticsModule);
  const configService = app.get(ConfigService);

  const tcpHost = configService.get<string>(
    'PRODUCT_STOCK_TCP_HOST',
    '0.0.0.0',
  );
  const tcpPort = configService.get<number>('PRODUCT_STOCK_TCP_PORT', 5005);
  const httpPort = configService.get<number>('LOGISTICS_HTTP_PORT', 3005);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: tcpHost,
      port: tcpPort,
    },
  });

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Logistics Microservice')
    .setDescription('API de logística: envíos, stock, seguimiento, etc.')
    .setVersion('1.0')
    .addTag('logistics')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Pipes (Validación global)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS para el frontend (ajusta según tus necesidades)
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Arranca ambos: microservicio TCP y HTTP REST
  await app.startAllMicroservices();
  await app.listen(httpPort);

  console.log(
    `📦 Logistics Microservice corriendo en HTTP: http://localhost:${httpPort}`,
  );
  console.log(`📑 Logistics Swagger en: http://localhost:${httpPort}/api`);
  console.log(
    `🔌 Logistics Microservice TCP escuchando en: ${tcpHost}:${tcpPort}`,
  );
}

bootstrap();
