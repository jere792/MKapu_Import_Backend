/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
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
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-role',
      'x-transfer-mode',
    ],
  });

  // Usamos 127.0.0.1 para que resuelva localmente en IPv4 (Evita el ECONNREFUSED)
  const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://127.0.0.1:3001';
  const adminUrl = process.env.ADMIN_SERVICE_URL ?? 'http://127.0.0.1:3002';
  const salesUrl = process.env.SALES_SERVICE_URL ?? 'http://127.0.0.1:3003';
  const logisticsUrl =
    process.env.LOGISTICS_SERVICE_URL ?? 'http://127.0.0.1:3005';

  // --- 1. PROXY HTTP (SIN WebSockets) ---
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
    }),
  );
  app.use(
    '/admin',
    createProxyMiddleware({
      target: adminUrl,
      changeOrigin: true,
      pathRewrite: { '^/admin': '' },
    }),
  );
  app.use(
    '/logistics',
    createProxyMiddleware({
      target: logisticsUrl,
      changeOrigin: true,
      pathRewrite: { '^/logistics': '' },
    }),
  );

  // --- 2. PROXY DEDICADO PARA WEBSOCKETS ---
  const wsProxy = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true,
  });

  wsProxy.on('error', (err, _req: IncomingMessage, socket: Socket) => {
    console.error('[WS Error]', err.message);
    socket.destroy();
  });

  const wsRoutes = [
    { prefix: '/sales', target: salesUrl },
    { prefix: '/admin', target: adminUrl },
    { prefix: '/logistics', target: logisticsUrl },
  ];

  app
    .getHttpServer()
    .on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
      const url = String(req.url ?? '');
      console.log(`[WS Upgrade] ${url}`);

      const route = wsRoutes.find((r) => url.startsWith(r.prefix));
      if (!route) {
        socket.destroy();
        return;
      }

      req.url = url.replace(new RegExp(`^${route.prefix}`), '') || '/';

      wsProxy.ws(req, socket, head, { target: route.target }, () => {
        socket.destroy();
      });
    });

  await app.listen(3000);
  console.log('API Gateway corriendo en http://localhost:3000');
}

void bootstrap();
