/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CulqiPaymentAdapter } from './infrastructure/adapters/out/culqui-payment.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'CULQI_CLIENT',
      useFactory: (configService: ConfigService) => {
        const Culqi = require('culqi-node');
        return new Culqi({
          privateKey: configService.get<string>('CULQI_PRIVATE_KEY'),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'PaymentPortsOut',
      useClass: CulqiPaymentAdapter,
    },
  ],
  exports: ['PaymentPortsOut'],
})
export class PaymentModule {}
