/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-role'],
  });

  const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const adminUrl = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3002';
  const salesUrl = process.env.SALES_SERVICE_URL ?? 'http://localhost:3003';
  const logisticsUrl =
    process.env.LOGISTICS_SERVICE_URL ?? 'http://localhost:3005';

  app.use(
    '/auth',
    createProxyMiddleware({
      target: authUrl,
      changeOrigin: true,
      pathRewrite: { '^/auth': '' },
    }),
  );

  app.use(
    '/admin',
    createProxyMiddleware({
      target: adminUrl,
      changeOrigin: true,
      ws: true,
      logger: console,
    }),
  );

  app.use(
    '/logistics',
    createProxyMiddleware({
      target: logisticsUrl,
      changeOrigin: true,
      ws: true,
      logger: console,
    }),
  );

  app.use(
    '/sales',
    createProxyMiddleware({
      target: salesUrl,
      changeOrigin: true,
      pathRewrite: { '^/sales': '' },
      logger: console,
    }),
  );

  await app.listen(3000);

  console.log('🌍 API Gateway corriendo en http://localhost:3000');
}
bootstrap();
