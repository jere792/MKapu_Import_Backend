/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* sales/src/core/sales-receipt/sales-receipt.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { SalesReceiptOrmEntity } from './infrastructure/entity/sales-receipt-orm.entity';
import { SalesTypeOrmEntity } from './infrastructure/entity/sales-type-orm.entity';
import { ReceiptTypeOrmEntity } from './infrastructure/entity/receipt-type-orm.entity';
import { SunatCurrencyOrmEntity } from './infrastructure/entity/sunat-currency-orm.entity';
import { CustomerOrmEntity } from '../customer/infrastructure/entity/customer-orm.entity';
import { DocumentTypeOrmEntity } from '../customer/infrastructure/entity/document-type-orm.entity';
import { SalesReceiptDetailOrmEntity } from './infrastructure/entity/sales-receipt-detail-orm.entity';
import { PaymentTypeOrmEntity } from './infrastructure/entity/payment-type-orm.entity';
import { PaymentOrmEntity } from './infrastructure/entity/payment-orm.entity';
import { VoucherOrmEntity } from './infrastructure/entity/voucher-orm.entity';
import { CashMovementOrmEntity } from './infrastructure/entity/cash-movement-orm.entity';

import { SalesReceiptCommandService } from './application/service/sales-receipt-command.service';
import { SalesReceiptQueryService } from './application/service/sales-receipt-query.service';
import { LogisticsStockProxy } from './infrastructure/adapters/out/TCP/logistics-stock.proxy';
import { AdminTcpProxy } from './infrastructure/adapters/out/TCP/admin-tcp.proxy';

import { SalesReceiptRepository } from './infrastructure/adapters/out/repository/sales-receipt.respository';
import { PaymentRepository } from './infrastructure/adapters/out/repository/payment.repository';
import { CustomerRepository } from '../customer/infrastructure/adapters/out/repository/customer.repository';

import { CustomerModule } from '../customer/customer.module';
import { SalesReceiptRestController } from './infrastructure/adapters/in/controllers/sales-receipt-rest.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    ClientsModule.registerAsync([
      {
        name: 'LOGISTICS_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('LOGISTICS_HOST', 'localhost'),
            port: 3004,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'ADMIN_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('ADMIN_HOST', 'localhost'),
            port: 3011,
          },
        }),
        inject: [ConfigService],
      },
    ]),
    TypeOrmModule.forFeature([
      SalesReceiptOrmEntity,
      SalesTypeOrmEntity,
      ReceiptTypeOrmEntity,
      SalesReceiptDetailOrmEntity,
      SunatCurrencyOrmEntity,
      CustomerOrmEntity,
      DocumentTypeOrmEntity,
      SalesReceiptDetailOrmEntity,
      PaymentTypeOrmEntity,
      PaymentOrmEntity,
      VoucherOrmEntity,
      CashMovementOrmEntity,
    ]),
    CustomerModule,
  ],

  controllers: [SalesReceiptRestController],

  providers: [
    SalesReceiptCommandService,
    SalesReceiptQueryService,
    SalesReceiptRepository,
    PaymentRepository,
    LogisticsStockProxy,
    AdminTcpProxy,

    {
      provide: 'ISalesReceiptCommandPort',
      useClass: SalesReceiptCommandService,
    },
    {
      provide: 'ISalesReceiptQueryPort',
      useClass: SalesReceiptQueryService,
    },
    {
      provide: 'ISalesReceiptRepositoryPort',
      useClass: SalesReceiptRepository,
    },
    {
      provide: 'IPaymentRepositoryPort',
      useClass: PaymentRepository,
    },
    {
      provide: 'ICustomerRepositoryPort',
      useClass: CustomerRepository,
    },
    {
      provide: 'IStockRepositoryPort',
      useClass: LogisticsStockProxy,
    },
  ],

  exports: [
    SalesReceiptCommandService,
    SalesReceiptQueryService,
    'ISalesReceiptRepositoryPort',
    'ISalesReceiptQueryPort',
    AdminTcpProxy,
  ],
})
export class SalesReceiptModule {}
