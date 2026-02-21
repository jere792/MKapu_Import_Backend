/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RemissionOrmEntity } from './infrastructure/entity/remission-orm.entity';
import { RemissionDetailOrmEntity } from './infrastructure/entity/remission-detail-orm.entity';

import { RemissionTypeormRepository } from './infrastructure/adapters/out/repository/remission-typeorm.repository';
import { RemissionCommandService } from './application/service/remission-command.service';
import { RemissionController } from './infrastructure/adapters/in/controller/remission.controller';
import { CarrierOrmEntity } from './infrastructure/entity/carrier-orm.entity';
import { DriverOrmEntity } from './infrastructure/entity/driver-orm.entity';
import { GuideTransferOrm } from './infrastructure/entity/transport_guide-orm.entity';
import { UbigeoOrmEntity } from './infrastructure/entity/ubigeo-orm.entity';
import { VehiculoOrmEntity } from './infrastructure/entity/vehicle-orm.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/common/infrastructure/strategies/jwt.strategy';
import { SalesGateway } from './infrastructure/adapters/out/sales-gateway';
import { InventoryFacadeAdapter } from './infrastructure/adapters/out/inventory-facade.adapter';
import { InventoryRemissionHandler } from './application/events/inventory-remission.handler';
import { SalesRemissionHandler } from './application/events/sales-remission.handler';
import { InventoryModule } from '../../warehouse/inventory/inventory.module';
import { ProductsGateway } from './infrastructure/adapters/out/products-gateway';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ADMIN_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ADMIN_HOST || 'localhost',
          port: Number(process.env.ADMIN_TCP_PORT) || 3004,
        },
      },
    ]),
    InventoryModule,
    TypeOrmModule.forFeature([
      RemissionOrmEntity,
      RemissionDetailOrmEntity,
      CarrierOrmEntity,
      DriverOrmEntity,
      GuideTransferOrm,
      UbigeoOrmEntity,
      VehiculoOrmEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    ClientsModule.registerAsync([
      {
        name: 'SALES_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('SALES_MICROSERVICE_HOST') || 'localhost',
            port: config.get('SALES_MICROSERVICE_PORT') || 3012,
          },
        }),
      },
    ]),
  ],
  controllers: [RemissionController],
  providers: [
    RemissionCommandService,
    {
      provide: 'RemissionRepositoryPort',
      useClass: RemissionTypeormRepository,
    },
    {
      provide: 'SalesGatewayPort',
      useClass: SalesGateway,
    },
    {
      provide: 'InventoryFacadePort',
      useClass: InventoryFacadeAdapter,
    },
    {
      provide: 'ProductsGatewayPort',
      useClass: ProductsGateway,
    },
    InventoryRemissionHandler,
    SalesRemissionHandler,
    JwtStrategy,
  ],
  exports: [],
})
export class RemissionModule {}
