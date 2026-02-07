/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

//módulos
import { ProductModule } from './core/catalog/product/product.module';
import { CategoryModule } from './core/catalog/category/category.module';
import { StoreModule } from './core/warehouse/store/store.module';
import { UnitModule } from './core/catalog/unit/unit.module';
import { TransferModule } from './core/warehouse/transfer/transfer.module';
import { SupplierModule } from './core/procurement/supplier/supplier.module';
import { WastageModule } from './core/catalog/wastage/wastage.module';
import { InventoryModule } from './core/warehouse/inventory/inventory.module';


//entities ORM
import { StoreOrmEntity } from './core/warehouse/store/infrastructure/entity/store-orm.entity';
import { CategoryOrmEntity } from './core/catalog/category/infrastructure/entity/category-orm.entity';
import { ProductOrmEntity } from './core/catalog/product/infrastructure/entity/product-orm.entity';
import { UnitOrmEntity } from './core/catalog/unit/infrastructure/entity/unit-orm.entity';
import { TransferDetailOrmEntity } from './core/warehouse/transfer/infrastructure/entity/transfer-detail-orm.entity';
import { TransferOrmEntity } from './core/warehouse/transfer/infrastructure/entity/transfer-orm.entity';
import { SupplierOrmEntity } from './core/procurement/supplier/infrastructure/entity/supplier-orm.entity';
import { WastageDetailOrmEntity } from './core/catalog/wastage/infrastructure/entity/wastage-detail.orm.entity';
import { WastageOrmEntity } from './core/catalog/wastage/infrastructure/entity/wastage-orm.entity';
import { StockOrmEntity } from './core/warehouse/inventory/infrastructure/entity/stock-orm-intity';



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
        entities:[
          CategoryOrmEntity,
          StoreOrmEntity,
          ProductOrmEntity,
          UnitOrmEntity,
          TransferOrmEntity,
          TransferDetailOrmEntity,
          SupplierOrmEntity,
          WastageOrmEntity,
          WastageDetailOrmEntity,
          StockOrmEntity,
        ],
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
      }),
    }),

    // Módulos del microservicio
    CategoryModule,
    StoreModule,
    UnitModule,
    ProductModule,
    TransferModule,
    SupplierModule,
    WastageModule,
    InventoryModule,
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
})
export class LogisticsModule {}
