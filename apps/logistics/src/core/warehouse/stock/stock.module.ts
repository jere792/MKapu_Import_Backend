import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './application/service/stock.service';
import { StockRepository } from './infrastructure/adapters/out/repository/stock.repository';
import { StockOrmEntity } from './infrastructure/entity/stock-domain-intity';

@Module({
  imports: [TypeOrmModule.forFeature([StockOrmEntity])],
  providers: [
    StockService,
    {
      provide: 'StockPortsOut',
      useClass: StockRepository,
    },
  ],
  exports: [StockService],
})
export class StockModule {}
