/* auth/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.AUTH_PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Auth Microservice is running on: http://localhost:${port}`);
}
bootstrap();
