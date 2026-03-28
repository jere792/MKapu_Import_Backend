import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryMovementOrmEntity } from './infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './infrastructure/entity/inventory-movement-detail-orm.entity';
import { StockOrmEntity } from './infrastructure/entity/stock-orm-entity';
import { WarehouseOrmEntity } from '../infrastructure/entity/warehouse-orm.entity';

import { InventoryCommandService } from './application/service/inventory/inventory-command.service';
import { InventoryTypeOrmRepository } from './infrastructure/adapters/out/repository/inventory-typeorm.repository';
import { InventoryMovementRestController } from './infrastructure/adapters/in/controllers/inventory-rest.controller';
import { ConteoInventarioOrmEntity } from './infrastructure/entity/inventory-count-orm.entity';
import { ConteoInventarioDetalleOrmEntity } from './infrastructure/entity/inventory-count-detail-orm.entity';
import { InventoryCountController } from './infrastructure/adapters/in/controllers/inventory-count.controller';
import { InventoryCountRepository } from './infrastructure/adapters/out/repository/inventory-count.repository';
import { InventoryCountCommandService } from './application/service/count/inventory-count-command.service';
import { InventoryCountQueryService } from './application/service/count/inventory-count-query.service';
import { InventoryQueryService } from './application/service/inventory/inventory-query.service';
import { SedeOrmEntity } from '../../catalog/product/infrastructure/entity/sede-orm.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductOrmEntity } from '../../catalog/product/infrastructure/entity/product-orm.entity';
import { CategoryOrmEntity } from '../../catalog/product/infrastructure/entity/category-orm.entity';
import { ProductModule } from '../../catalog/product/product.module';
import { AdminTcpProxy } from './infrastructure/adapters/out/TCP/admin-tcp.proxy';
import { InventoryMessageController } from './infrastructure/adapters/in/TCP/inventory-message.controller';


@Module({
  imports: [
    forwardRef(() => ProductModule),
    ClientsModule.register([
      {
        name: 'ADMIN_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ADMIN_TCP_HOST || 'localhost',
          port: Number(process.env.ADMIN_TCP_PORT || 3011),
        },
      },
    ]),
    TypeOrmModule.forFeature([
      InventoryMovementOrmEntity,
      InventoryMovementDetailOrmEntity,
      ConteoInventarioOrmEntity,
      ConteoInventarioDetalleOrmEntity,
      StockOrmEntity,
      WarehouseOrmEntity,
      SedeOrmEntity,
      ProductOrmEntity,
      CategoryOrmEntity,
    ]),
  ],
  controllers: [InventoryMovementRestController, InventoryCountController, InventoryMessageController],
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
    {
      provide: 'IInventoryCountRepository',
      useClass: InventoryCountRepository,
    },
    InventoryCountCommandService,
    InventoryCountQueryService,
    AdminTcpProxy,
  ],
  exports: [
    InventoryCommandService,
    InventoryQueryService,
    InventoryTypeOrmRepository,
    'IInventoryRepositoryPort',
    'IInventoryCountRepository',
    InventoryCountCommandService,
    InventoryCountQueryService,
    InventoryTypeOrmRepository,
  ],
})
export class InventoryModule {}
