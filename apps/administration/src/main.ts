import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AdministrationModule } from './administration.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AdministrationModule);
  const configService = app.get(ConfigService);

  const tcpHost = configService.get<string>('USERS_TCP_HOST', '0.0.0.0');
  const tcpPort = configService.get<number>('USERS_TCP_PORT', 3011);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: tcpHost,
      port: tcpPort,
      retryAttempts: 5,
      retryDelay: 3011,
    },
  });

  await app.startAllMicroservices();

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Administration Microservice')
    .setDescription(
      'API del microservicio de administración de usuarios, roles, etc.',
    )
    .setVersion('1.0')
    .addTag('administration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const httpPort = configService.get<number>('ADMINISTRATION_PORT', 3002);
  await app.listen(httpPort);

  console.log(`🏢 Administration HTTP: http://localhost:${httpPort}`);
  console.log(`📑 Administration Swagger: http://localhost:${httpPort}/api`);
  console.log(`📡 Administration TCP: ${tcpHost}:${tcpPort}`);
}

bootstrap();
