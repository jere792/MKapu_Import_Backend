import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AdministrationModule } from './administration.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AdministrationModule);
  const configService = app.get(ConfigService);

  // Configuración TCP
  const tcpHost = configService.get<string>('USERS_TCP_HOST', '0.0.0.0');
  const tcpPort = configService.get<number>('USERS_TCP_PORT', 3011);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: tcpHost,
      port: tcpPort,
      retryAttempts: 5,
      retryDelay: 3000,
    },
  });

  await app.startAllMicroservices();

  // Configuración HTTP
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const httpPort = configService.get<number>('ADMINISTRATION_PORT', 3002);
  await app.listen(httpPort);

  console.log(`🏢 Administration HTTP: http://localhost:${httpPort}`);
  console.log(`📡 Administration TCP: ${tcpHost}:${tcpPort}`);
}

bootstrap();