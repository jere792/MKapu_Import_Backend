import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseOrmEntity } from './infrastructure/entity/warehouse-orm.entity';
import { WarehouseRestController } from './infrastructure/adapters/in/controllers/warehouse-rest.controller';
import { WarehouseTcpController } from './infrastructure/adapters/in/TCP/warehouse-tcp.controller';
import { WarehouseQueryService } from './application/service/warehouse-query.service';
import { WarehouseCommandService } from './application/service/warehouse-command.service';
import { WarehouseTypeormRepository } from './infrastructure/adapters/out/repository/warehouse.repository';
import { IWarehouseRepository } from './domain/ports/out/warehouse-ports-out';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseOrmEntity])],
  controllers: [WarehouseRestController, WarehouseTcpController],
  providers: [
    WarehouseQueryService,
    WarehouseCommandService,
    WarehouseTypeormRepository,
    {
      provide: IWarehouseRepository,
      useClass: WarehouseTypeormRepository,
    },
  ],
  exports: [WarehouseQueryService, WarehouseCommandService],
})
export class WarehouseModule {}