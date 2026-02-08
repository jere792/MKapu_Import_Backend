/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionController } from './infrastructure/adapters/in/controllers/commission.controller';
import { CommissionCommandService } from './application/service/commission-command.service';
import { CommissionQueryService } from './application/service/commission-query.service';
import { CommissionRepository } from './infrastructure/adapters/out/repository/commission.repository';
import { COMMISSION_REPOSITORY } from './domain/ports/out/commission-repository.port';
import { CommissionRuleOrmEntity } from './infrastructure/entity/commission-rule-orm.entity';
import { SalesReceiptModule } from '../sales-receipt/sales-receipt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommissionRuleOrmEntity]),
    SalesReceiptModule,
  ],
  controllers: [CommissionController],
  providers: [
    CommissionCommandService,
    CommissionQueryService,
    {
      provide: COMMISSION_REPOSITORY,
      useClass: CommissionRepository,
    },
  ],
  exports: [CommissionQueryService],
})
export class CommissionModule {}
