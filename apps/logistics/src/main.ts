/* logistics/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { LogisticsModule } from './logistics.module';

async function bootstrap() {
  const app = await NestFactory.create(LogisticsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
