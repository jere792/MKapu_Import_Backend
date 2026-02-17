import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuctionOrmEntity } from './infrastructure/entity/auction-orm.entity';
import { AuctionDetailOrmEntity } from './infrastructure/entity/auction-detail.orm.entity';

import { AuctionController } from './infrastructure/adapters/in/controllers/auction.controller';
import { AuctionCommandService } from './application/service/auction-command.service';
import { AuctionQueryService } from './application/service/auction-query.service';
import { AuctionTypeormRepository } from './infrastructure/adapters/out/repository/auction-typeorm.repository';

import { InventoryModule } from '../../warehouse/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuctionOrmEntity, AuctionDetailOrmEntity]),
    InventoryModule,


  ],
  controllers: [AuctionController],
  providers: [
    AuctionCommandService,
    AuctionQueryService,
    {
      provide: 'IAuctionRepositoryPort',
      useClass: AuctionTypeormRepository,
    },
    {
      provide: 'IAuctionPortsIn',
      useClass: AuctionCommandService,
    },
    {
      provide: 'IAuctionPortsQuery',
      useClass: AuctionQueryService,
    },
  ],
  exports: ['IAuctionRepositoryPort', 'IAuctionPortsIn', 'IAuctionPortsQuery', TypeOrmModule],
})
export class AuctionModule {}