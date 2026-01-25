/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

//módulos
import { CategoryModule } from './core/catalog/category/category.module';
import { SupplierModule } from './core/procurement/supplier/supplier.modul';
import { StoreModule } from './core/warehouse/store/store.module';

import { StoreOrmEntity } from './core/warehouse/store/infrastructure/entity/store-orm.entity';
import { CategoryOrmEntity } from './core/catalog/category/infrastructure/entity/category-orm.entity';
import { InventoryMovementOrmEntity } from './core/warehouse/inventory-movement/infrastructure/entity/inventory-movement-orm.entity';
import { InventoryMovementDetailOrmEntity } from './core/warehouse/inventory-movement/infrastructure/entity/inventory-movement-detail-orm.entity';
import { InventoryMovementModule } from './core/warehouse/inventory-movement/inventory-movement.module';
import { ProductOrmEntity } from './core/catalog/product/infrastructure/entity/product-orm.entity';
import { StockOrmEntity } from './core/warehouse/stock/infrastructure/entity/stock-orm-intity';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('LOGISTICS_DB_HOST'),
        port: configService.get<number>('LOGISTICS_DB_PORT'),
        username: configService.get<string>('LOGISTICS_DB_USERNAME'),
        password: configService.get<string>('LOGISTICS_DB_PASSWORD'),
        database: configService.get<string>('LOGISTICS_DB_DATABASE'),
        entities: [CategoryOrmEntity, StoreOrmEntity, InventoryMovementOrmEntity, InventoryMovementDetailOrmEntity, ProductOrmEntity, StockOrmEntity],
        synchronize: true,
        logging: true,
      }),
    }),

    // Módulos del microservicio
    CategoryModule,
    StoreModule,
    InventoryMovementModule,
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
})
export class LogisticsModule {}
