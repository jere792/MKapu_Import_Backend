/* sales/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { SalesModule } from './sales.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(SalesModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    credentials: true,
  });
  const port = configService.get<number>('SALES_PORT') || 3004;
  await app.listen(port);
}
bootstrap();
