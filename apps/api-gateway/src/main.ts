/*  api-gateway/src/mainModule.ts */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Microservicio de Autenticación
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001/auth',
      changeOrigin: true,
      //pathRewrite: { '^/auth': '' },
    }),
  );
  
  // Microservicio de Administración
  app.use(
    '/admin', 
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      ws:true,
      pathRewrite: { '^/admin': '' },
    }),
  );
  
  // Microservicio de Ventas
  app.use(
    '/sales',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
      pathRewrite: { '^/sales': '' },
    }),
  );
  
  // Microservicio de Logística
  app.use(
    '/logistics',
    createProxyMiddleware({
      target: 'http://localhost:3004',
      changeOrigin: true,
      pathRewrite: { '^/logistics': '' },
    }),
  );

  await app.listen(3000);
  console.log(`🌍 API Gateway corriendo en: http://localhost:3000`);
}
bootstrap();