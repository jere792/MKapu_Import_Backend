/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* api-gateway/src/mainModule.ts */
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

  // 1. Definición de Proxies con soporte para WebSockets
  const adminProxy = createProxyMiddleware({
    target: adminUrl,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/admin': '' },
    logger: console,
    on: {
      proxyReqWs: (proxyReq, req, socket) => {
        socket.on('error', (err) => console.error('WS Proxy Error (Admin):', err));
        socket.setKeepAlive(true, 1000);
      }
    }
  });

  const logisticsProxy = createProxyMiddleware({
    target: logisticsUrl,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/logistics': '' },
    logger: console,
    on: {
      proxyReqWs: (proxyReq, req, socket) => {
        socket.on('error', (err) => console.error('WS Proxy Error (Logistics):', err));
        socket.setKeepAlive(true, 1000);
      }
    }
  });

  // 2. Registro de rutas para peticiones HTTP
  app.use('/auth', createProxyMiddleware({ target: authUrl, changeOrigin: true, pathRewrite: { '^/auth': '' } }));
  app.use('/admin', adminProxy);
  app.use('/logistics', logisticsProxy);
  app.use('/sales', createProxyMiddleware({
    target: salesUrl,
    changeOrigin: true,
    pathRewrite: { '^/sales': '' },
    on: {
      proxyReq: (proxyReq, req: any) => {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
    },
    logger: console,
  }));

  // 3. Inicio del servidor
  const server = await app.listen(3000);

  // 4. 🚀 MANEJO MANUAL DE HANDSHAKES PARA TODOS LOS NAMESPACES
  // Esto soluciona el timeout al interceptar los protocolos de cambio (Upgrade)
  server.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    
    // Condición para todos los Gateways en el microservicio Administration (3002)
    const isAdminSocket = 
      url.startsWith('/admin') || 
      url.startsWith('/users') || 
      url.startsWith('/roles') || 
      url.startsWith('/permissions') || 
      url.startsWith('/headquarters');

    if (isAdminSocket) {
      console.log(`⚡ Handshake detectado para ADMINISTRATION (Namespace: ${url})`);
      adminProxy.upgrade(req, socket, head);
    } 
    // Condición para Gateways en el microservicio Logistics (3003)
    else if (url.startsWith('/logistics') || url.startsWith('/products')) {
      console.log(`⚡ Handshake detectado para LOGISTICS (Namespace: ${url})`);
      logisticsProxy.upgrade(req, socket, head);
    }
  });

  console.log(`🌍 API Gateway MKapu Import corriendo en: http://localhost:3000`);
}
bootstrap();