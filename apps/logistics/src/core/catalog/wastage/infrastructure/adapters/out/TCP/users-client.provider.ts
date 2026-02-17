// logistics/src/core/catalog/wastage/infrastructure/adapters/out/TCP/users-client.provider.ts
import { Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const UsersClientProvider: Provider = {
  provide: 'USERS_SERVICE',
  useFactory: (configService: ConfigService) => {
    const host = configService.get<string>('USERS_TCP_HOST', 'localhost');
    const port = configService.get<number>('USERS_TCP_PORT', 3011);

    console.log(`🔌 Configurando cliente TCP para USERS_SERVICE en ${host}:${port}`);

    return ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    });
  },
  inject: [ConfigService],
};