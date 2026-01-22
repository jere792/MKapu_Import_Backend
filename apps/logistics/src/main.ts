/* logistics/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { LogisticsModule } from './logistics.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(LogisticsModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  const port = configService.get<number>('LOGISTICS_PORT') || 3003;
  await app.listen(port);
}
bootstrap();
