import { Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const AlmacenClientProvider: Provider = {
  provide: 'ALMACEN_SERVICE',
  useFactory: (configService: ConfigService) => {
    const host =
      configService.get<string>('LOGISTICS_TCP_HOST') ||
      configService.get<string>('LOGISTICS_HOST') ||
      'localhost';
    const port = Number(
      configService.get<string>('LOGISTICS_TCP_PORT') || 3004,
    );

    return ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host, port },
    });
  },
  inject: [ConfigService],
};