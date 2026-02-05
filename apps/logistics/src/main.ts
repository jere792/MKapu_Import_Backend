/* logistics/src/main.ts */

import { NestFactory } from '@nestjs/core';
import { LogisticsModule } from './logistics.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(LogisticsModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3004,
    },
  });
  await app.startAllMicroservices();
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(3003);
  console.log(`📦 Logistics Microservice corriendo en: http://localhost:3004`);
}

bootstrap();
