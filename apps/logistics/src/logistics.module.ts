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
import { SupplierOrmEntity } from './core/procurement/supplier/infrastructure/entity/supplier-orm.entity';

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
        entities: [CategoryOrmEntity, StoreOrmEntity, SupplierOrmEntity],
        synchronize: true,
        logging: true,
      }),
    }),

    // Módulos del microservicio
    CategoryModule,
    StoreModule,
    SupplierModule,

  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
})
export class LogisticsModule {}
