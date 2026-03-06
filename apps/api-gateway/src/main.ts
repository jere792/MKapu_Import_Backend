/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as httpProxy from 'http-proxy';
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

  // ── HTTP proxies (sin ws:true para evitar conflicto) ──
  app.use(
    '/auth',
    createProxyMiddleware({
      target: authUrl,
      changeOrigin: true,
      pathRewrite: { '^/auth': '' },
    }),
  );
  app.use(
    '/sales',
    createProxyMiddleware({
      target: salesUrl,
      changeOrigin: true,
      pathRewrite: { '^/sales': '' },
      ws: true,
    }),
  );
  app.use(
    '/admin',
    createProxyMiddleware({
      target: adminUrl,
      changeOrigin: true,
      pathRewrite: { '^/admin': '' },
      ws: true,
    }),
  );
  app.use(
    '/logistics',
    createProxyMiddleware({
      target: logisticsUrl,
      changeOrigin: true,
      pathRewrite: { '^/logistics': '' },
      ws: true,
    }),
  );

  const wsProxy = httpProxy.createProxyServer({ changeOrigin: true });

  wsProxy.on('error', (err, req, socket) => {
    console.error('[WS Error]', err.message);
    (socket as any).destroy?.();
  });

  const wsRoutes: { prefix: string; target: string }[] = [
    { prefix: '/sales', target: salesUrl },
    { prefix: '/admin', target: adminUrl },
    { prefix: '/logistics', target: logisticsUrl },
  ];

  app.getHttpServer().on('upgrade', (req: any, socket: any, head: any) => {
    const url: string = req.url ?? '';
    console.log(`[WS Upgrade] ${url}`);

    const route = wsRoutes.find((r) => url.startsWith(r.prefix));
    if (!route) {
      socket.destroy();
      return;
    }

    // Reescribir el path igual que hace pathRewrite
    req.url = url.replace(new RegExp(`^${route.prefix}`), '') || '/';

    wsProxy.ws(req, socket, head, { target: route.target }, (err) => {
      console.error('[WS Proxy Error]', err);
      socket.destroy();
    });
  });

  await app.listen(3000);
  console.log('🌍 API Gateway corriendo en http://localhost:3000');
}
bootstrap();
