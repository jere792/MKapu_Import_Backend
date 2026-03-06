/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { SalesModule } from './sales.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <-- importa swagger

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
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sales Microservice')
    .setDescription('API Gestión de Cotizaciones, Ventas, etc.')
    .setVersion('1.0')
    .addTag('sales')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.startAllMicroservices();

  await app.listen(port);

  console.log(
    `💰 Sales Microservice corriendo en: http://localhost:${port} (TCP interno: 3012)`,
  );
  console.log(`📑 Swagger en: http://localhost:${port}/api`);
}

bootstrap();
