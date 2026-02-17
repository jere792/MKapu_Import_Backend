import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTIDADES (Asegúrate de importar las 3)
import { InventoryMovementOrmEntity } from './infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './infrastructure/entity/inventory-movement-detail-orm.entity';
import { StockOrmEntity } from './infrastructure/entity/stock-orm-intity'; // Revisa si es 'stock-orm-entity' o 'stock-orm-intity'

// PUERTOS Y ADAPTADORES
import { InventoryCommandService } from './application/service/inventory-command.service';
import { InventoryTypeOrmRepository } from './infrastructure/adapters/out/repository/inventory-typeorm.repository';
import { InventoryMovementRestController } from './infrastructure/adapters/in/controllers/inventory-rest.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovementOrmEntity,      
      InventoryMovementDetailOrmEntity, 
      StockOrmEntity                    
    ]),
  ],
  controllers: [InventoryMovementRestController],
  providers: [
    {
      provide: 'IInventoryMovementCommandPort', 
      useClass: InventoryCommandService,
    },
    InventoryCommandService,

    // El repositorio (Adaptador de Salida)
    {
      provide: 'IInventoryRepositoryPort', // El token que usas en el Service
      useClass: InventoryTypeOrmRepository,
    },
  ],
  exports: [
    // Exportamos el servicio para que Transferencias y Mermas puedan usarlo
    InventoryCommandService,
    'IInventoryMovementCommandPort'
  ],
})
export class InventoryModule {}