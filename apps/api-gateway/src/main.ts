/*  api-gateway/src/mainModule.ts */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const adminUrl = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3002';
  const logisticsUrl = process.env.LOGISTICS_SERVICE_URL ?? 'http://localhost:3003';
  const salesUrl = process.env.SALES_SERVICE_URL ?? 'http://localhost:3004';
  
  app.use(
    '/auth',
    createProxyMiddleware({
      target: `${authUrl}`, 
      changeOrigin: true,
      pathRewrite: { '^/auth': '' },
    }),
  );
  
  app.use(
    '/admin', 
    createProxyMiddleware({
      target: `${adminUrl}`,
      changeOrigin: true,
      ws:true,
      pathRewrite: { '^/admin': '' },
    }),
  );
  
  app.use(
    '/sales',
    createProxyMiddleware({
      target: `${salesUrl}`,
      changeOrigin: true,
      pathRewrite: { '^/sales': '' },
    }),
  );
  
  app.use(
    '/logistics',
    createProxyMiddleware({
      target: `${logisticsUrl}`,
      changeOrigin: true,
      pathRewrite: { '^/logistics': '' },
    }),
  );

  await app.listen(3000);
  console.log(`🌍 API Gateway corriendo en: http://localhost:3000`);
}
bootstrap();