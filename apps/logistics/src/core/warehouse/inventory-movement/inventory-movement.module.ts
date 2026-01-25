import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades (Para que TypeORM las inyecte en este feature)
import { InventoryMovementOrmEntity } from './infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './infrastructure/entity/inventory-movement-detail-orm.entity';

// Puertos y Adaptadores
import { InventoryMovementRepository } from './infrastructure/adapters/out/repository/inventory-movement.repository';
import { InventoryMovementCommandService } from './application/service/inventory-movement-command.service';
import { InventoryMovementRestController } from './infrastructure/adapters/in/controllers/inventory-movement-rest.controller';
import { StockModule } from '../stock/stock.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovementOrmEntity,
      InventoryMovementDetailOrmEntity,
    ]),
    StockModule,
  ],
  controllers: [InventoryMovementRestController],
  providers: [
    InventoryMovementCommandService,
    {
      provide: 'InventoryMovementPortsOut',
      useClass: InventoryMovementRepository,
    },
  ],
  exports: [InventoryMovementCommandService],
})
export class InventoryMovementModule {}
