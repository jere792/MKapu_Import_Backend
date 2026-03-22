import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BankOrmEntity } from './infrastructure/entity/bank-orm.entity';
import { ServiceTypeOrmEntity } from './infrastructure/entity/service-type-orm.entity';

import { BankQueryService } from './application/service/bank-query.service';
import { BankRepository } from './infrastructure/adapters/out/repository/bank.repository';
import { BankRestController } from './infrastructure/adapters/in/controllers/bank-rest.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankOrmEntity, ServiceTypeOrmEntity]),
  ],
  controllers: [BankRestController],
  providers: [
    BankQueryService,
    BankRepository,
    {
      provide: 'IBankQueryPort',
      useClass: BankQueryService,
    },
    {
      provide: 'IBankRepositoryPort',
      useClass: BankRepository,
    },
  ],
  exports: [BankQueryService, 'IBankQueryPort'],
})
export class BankModule {}