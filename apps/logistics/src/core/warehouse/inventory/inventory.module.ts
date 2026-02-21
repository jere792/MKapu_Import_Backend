import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryMovementOrmEntity } from './infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './infrastructure/entity/inventory-movement-detail-orm.entity';
import { StockOrmEntity } from './infrastructure/entity/stock-orm-entity';
import { WarehouseOrmEntity } from '../infrastructure/entity/warehouse-orm.entity';

import { InventoryCommandService } from './application/service/inventory-command.service';
import { InventoryTypeOrmRepository } from './infrastructure/adapters/out/repository/inventory-typeorm.repository';
import { InventoryMovementRestController } from './infrastructure/adapters/in/controllers/inventory-rest.controller';
import { InventoryQueryService } from './application/service/inventory-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovementOrmEntity,
      InventoryMovementDetailOrmEntity,
      StockOrmEntity,
      WarehouseOrmEntity,
    ]),
  ],
  controllers: [InventoryMovementRestController],
  providers: [
    {
      provide: 'IInventoryMovementCommandPort',
      useClass: InventoryCommandService,
    },
    InventoryCommandService,
    InventoryQueryService,          
    InventoryTypeOrmRepository,
    {
      provide: 'IInventoryRepositoryPort',
      useClass: InventoryTypeOrmRepository,
    },
  ],
  exports: [
    InventoryCommandService,
    InventoryQueryService,          
    InventoryTypeOrmRepository,
    'IInventoryRepositoryPort',
  ],
})
export class InventoryModule {}