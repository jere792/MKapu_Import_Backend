/* apps/sales/src/sales.module.ts */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { HttpModule } from '@nestjs/axios';

import { CustomerModule } from './core/customer/customer.module';
import { PromotionModule } from './core/promotion/promotion.module';
import { SalesReceiptModule } from './core/sales-receipt/sales-receipt.module';
import { CashboxModule } from './core/cashbox/cashbox.module';
import { QuoteModule } from './core/quote/quote.module';

import { CustomerOrmEntity } from './core/customer/infrastructure/entity/customer-orm.entity';
import { DocumentTypeOrmEntity } from './core/customer/infrastructure/entity/document-type-orm.entity';
import { PromotionOrmEntity } from './core/promotion/infrastructure/entity/promotion-orm.entity';
import { SalesReceiptOrmEntity } from './core/sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { SalesReceiptDetailOrmEntity } from './core/sales-receipt/infrastructure/entity/sales-receipt-detail-orm.entity'; // ✅ Faltaba
import { SalesTypeOrmEntity } from './core/sales-receipt/infrastructure/entity/sales-type-orm.entity'; // ✅ Para FK de tipo_venta
import { ReceiptTypeOrmEntity } from './core/sales-receipt/infrastructure/entity/receipt-type-orm.entity'; // ✅ Para FK de tipo_comprobante
import { SunatCurrencyOrmEntity } from './core/sales-receipt/infrastructure/entity/sunat-currency-orm.entity'; // ✅ Para 'PEN'
import { CashboxOrmEntity } from './core/cashbox/infrastructure/entity/cashbox-orm.entity';
import { QuoteOrmEntity } from './core/quote/infrastructure/entity/quote-orm.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClientsModule.register([
      {
        name: 'LOGISTICS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3004,
        },
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('SALES_DB_HOST'),
        port: configService.get<number>('SALES_DB_PORT'),
        username: configService.get('SALES_DB_USERNAME'),
        password: configService.get('SALES_DB_PASSWORD'),
        database: configService.get('SALES_DB_DATABASE'),
        entities: [
          CustomerOrmEntity,
          DocumentTypeOrmEntity,
          PromotionOrmEntity,
          SalesReceiptOrmEntity,
          SalesReceiptDetailOrmEntity,
          SalesTypeOrmEntity,
          ReceiptTypeOrmEntity,
          SunatCurrencyOrmEntity,
          CashboxOrmEntity,
          QuoteOrmEntity,
        ],
        synchronize: false,
        autoLoadEntities: true,
        extra: {
          connectionLimit: 10,
          waitForConnections: true,
          idleTimeout: 60000,
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    CustomerModule,
    PromotionModule,
    SalesReceiptModule,
    CashboxModule,
    QuoteModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [ClientsModule],
})
export class SalesModule {}
