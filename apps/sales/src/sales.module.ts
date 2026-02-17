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
import { SalesReceiptDetailOrmEntity } from './core/sales-receipt/infrastructure/entity/sales-receipt-detail-orm.entity'; 
import { SalesTypeOrmEntity } from './core/sales-receipt/infrastructure/entity/sales-type-orm.entity'; 
import { ReceiptTypeOrmEntity } from './core/sales-receipt/infrastructure/entity/receipt-type-orm.entity'; 
import { SunatCurrencyOrmEntity } from './core/sales-receipt/infrastructure/entity/sunat-currency-orm.entity';
import { CashboxOrmEntity } from './core/cashbox/infrastructure/entity/cashbox-orm.entity';
import { QuoteOrmEntity } from './core/quote/infrastructure/entity/quote-orm.entity';
import { WarrantyOrmEntity } from './core/warranty/infrastructure/entity/warranty-orm-entity';
import { WarrantyDetailOrmEntity } from './core/warranty/infrastructure/entity/warranty-detail-orm.entity';
import { WarrantyStatusOrmEntity } from './core/warranty/infrastructure/entity/warranty-status-orm.entity';
import { WarrantyTrackingOrmEntity } from './core/warranty/infrastructure/entity/warranty-tracking-orm.entity';
import { WarrantyRestController } from './core/warranty/infrastructure/adapters/in/warranty-rest.controller';
import { WarrantyCommandService } from './core/warranty/application/service/warranty-command.service';
import { WarrantyQueryService } from './core/warranty/application/service/warranty-query.service';
import { WarrantyLogisticsAdapter } from './core/warranty/infrastructure/adapters/out/warranty-logistics.adapter';
import { WarrantySalesAdapter } from './core/warranty/infrastructure/adapters/out/warranty-sales.adapter';
import { WarrantyRepository } from './core/warranty/infrastructure/adapters/out/warranty.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentTypeOrmEntity } from './core/sales-receipt/infrastructure/entity/payment-type-orm.entity';
import { PaymentOrmEntity } from './core/sales-receipt/infrastructure/entity/payment-orm.entity';
import { AccountingModule } from './core/accounting/accounting.module';
import { CpeDocumentOrmEntity } from './core/accounting/infrastructure/entity/cpe-document-orm.entity';
import { ReportsModule } from './core/reports/reports.module';
import { CashMovementOrmEntity } from './core/sales-receipt/infrastructure/entity/cash-movement-orm.entity';
import { ClaimModule } from './core/claim/claim.module';
import { ClaimOrmEntity } from './core/claim/infrastructure/entity/claim-orm.entity';
import { ClaimDetailOrmEntity } from './core/claim/infrastructure/entity/claim-detail-orm.entity';
import { CommissionModule } from './core/commission/commission.module';
import { CommissionOrmEntity } from './core/commission/infrastructure/entity/commission-orm.entity';
import { CommissionRuleOrmEntity } from './core/commission/infrastructure/entity/commission-rule-orm.entity';
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
          host: `${process.env.LOGISTICS_HOST || 'localhost'}`,
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
          WarrantyOrmEntity,
          WarrantyDetailOrmEntity,
          WarrantyStatusOrmEntity,
          WarrantyTrackingOrmEntity,
          PaymentTypeOrmEntity,
          PaymentOrmEntity,
          CpeDocumentOrmEntity,
          CashMovementOrmEntity,
          ClaimOrmEntity,
          ClaimDetailOrmEntity,
          CommissionOrmEntity,
          CommissionRuleOrmEntity,
        ],
        synchronize: false,
        logging: true,
        extra: {
          connectionLimit: 10,
          waitForConnections: true,
          idleTimeout: 60000,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      WarrantyOrmEntity,
      WarrantyDetailOrmEntity,
      WarrantyStatusOrmEntity,
      WarrantyTrackingOrmEntity,
    ]),
    HttpModule,
    CustomerModule,
    PromotionModule,
    SalesReceiptModule,
    CashboxModule,
    QuoteModule,
    AccountingModule,
    ReportsModule,
    ClaimModule,
    CommissionModule,
  ],
  controllers: [SalesController, WarrantyRestController],
  providers: [
    SalesService,
    WarrantyCommandService,
    WarrantyQueryService,
    {
      provide: 'IWarrantyRepositoryPort',
      useClass: WarrantyRepository,
    },
    {
      provide: 'IWarrantyLogisticsPort',
      useClass: WarrantyLogisticsAdapter,
    },
    {
      provide: 'IWarrantySalesPort',
      useClass: WarrantySalesAdapter,
    },
  ],
  exports: [SalesReceiptModule],
})
export class SalesModule {}
