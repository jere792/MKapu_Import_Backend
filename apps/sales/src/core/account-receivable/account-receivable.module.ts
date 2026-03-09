/* ============================================
   sales/src/core/account-receivable/account-receivable.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountReceivableOrmEntity } from './infrastructure/entity/account-receivable-orm.entity';

import { AccountReceivableRestController } from './infrastructure/adapters/in/controllers/account-receivable-rest.controller';

import { AccountReceivableCommandService } from './application/service/command/account-receivable-command.service';
import { AccountReceivableQueryService }   from './application/service/query/account-receivable-query.service';
import { AccountReceivableMapper }         from './application/mapper/account-receivable.mapper';

import { AccountReceivableTypeormRepository } from './infrastructure/adapters/out/repository/account-receivable-typeorm.repository';

import { ACCOUNT_RECEIVABLE_REPOSITORY } from './domain/ports/out/account-receivable-port-out';
import { PaymentTypeOrmEntity } from '../sales-receipt/infrastructure/entity/payment-type-orm.entity';
import { SunatCurrencyOrmEntity } from '../sales-receipt/infrastructure/entity/sunat-currency-orm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountReceivableOrmEntity,
      PaymentTypeOrmEntity,
      SunatCurrencyOrmEntity,
    ]),
  ],
  controllers: [AccountReceivableRestController],
  providers: [
    // ── Mapper ──────────────────────────────────────────────────────
    AccountReceivableMapper,

    // ── Command Service ─────────────────────────────────────────────
    {
      provide: 'ICreateAccountReceivableUseCase',
      useClass: AccountReceivableCommandService,
    },
    AccountReceivableCommandService,

    // ── Query Service ────────────────────────────────────────────────
    {
      provide: 'IGetAccountReceivableByIdUseCase',
      useClass: AccountReceivableQueryService,
    },
    AccountReceivableQueryService,

    // ── Repository ───────────────────────────────────────────────────
    {
      provide: ACCOUNT_RECEIVABLE_REPOSITORY,
      useClass: AccountReceivableTypeormRepository,
    },
  ],
  exports: [
    'ICreateAccountReceivableUseCase',
    'IGetAccountReceivableByIdUseCase',
    ACCOUNT_RECEIVABLE_REPOSITORY,
    AccountReceivableCommandService,
    AccountReceivableQueryService,
  ],
})
export class AccountReceivableModule {}