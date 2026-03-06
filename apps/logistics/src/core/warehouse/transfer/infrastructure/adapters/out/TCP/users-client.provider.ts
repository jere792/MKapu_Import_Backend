import { Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const UsersClientProvider: Provider = {
  provide: 'USERS_SERVICE',
  useFactory: (configService: ConfigService) => {
    const host = configService.get<string>('USERS_TCP_HOST', 'localhost');
    const port = configService.get<number>('USERS_TCP_PORT', 3011);

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
