/* sales/src/core/sales-receipt/sales-receipt.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios'; 

// Entidades ORM 
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

// Servicios y Proxies
import { SalesReceiptCommandService } from './application/service/sales-receipt-command.service';
import { SalesReceiptQueryService } from './application/service/sales-receipt-query.service';
import { LogisticsStockProxy } from './infrastructure/adapters/out/TCP/logistics-stock.proxy';

// Repositorios
import { SalesReceiptRepository } from './infrastructure/adapters/out/repository/sales-receipt.respository';
import { PaymentRepository } from './infrastructure/adapters/out/repository/payment.repository'; // ✅ Nuevo
import { CustomerRepository } from '../customer/infrastructure/adapters/out/repository/customer.repository';

// Otros
import { CustomerModule } from '../customer/customer.module';
import { SalesReceiptRestController } from './infrastructure/adapters/in/controllers/sales-receipt-rest.controller';

@Module({
  imports: [
    HttpModule, 
    TypeOrmModule.forFeature([
      SalesReceiptOrmEntity,
      SalesTypeOrmEntity,
      ReceiptTypeOrmEntity,
      SalesReceiptDetailOrmEntity, 
      SunatCurrencyOrmEntity,
      CustomerOrmEntity,
      DocumentTypeOrmEntity,
      PaymentTypeOrmEntity,
      PaymentOrmEntity,
      VoucherOrmEntity,
      CashMovementOrmEntity,
    ]),
    CustomerModule, 
  ],

  controllers: [
    SalesReceiptRestController,
  ],

  providers: [
    SalesReceiptCommandService,
    SalesReceiptQueryService,
    SalesReceiptRepository,
    PaymentRepository, 
    LogisticsStockProxy, 

    // Ports de Sales Receipt
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
    SalesReceiptQueryService
  ],
})
export class SalesReceiptModule {}