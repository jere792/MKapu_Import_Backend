import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

// ============================================
// ENTITIES (ORM)
// ============================================
import { ProductOrmEntity } from './infrastructure/entity/product-orm.entity';
import { StockOrmEntity } from './infrastructure/entity/stock-orm.entity';
import { CategoryOrmEntity } from './infrastructure/entity/category-orm.entity';
import { AlmacenOrmEntity } from './infrastructure/entity/almacen-orm.entity';
import { UnidadOrmEntity } from './infrastructure/entity/unidad-orm.entity';

// ============================================
// REPOSITORY
// ============================================
import { ProductTypeOrmRepository } from './infrastructure/adapters/out/repository/product-typeorm.repository';

// ============================================
// SERVICES
// ============================================
import { ProductQueryService } from './application/service/product-query.service';
import { ProductCommandService } from './application/service/product-command.service';

// ============================================
// CONTROLLERS
// ============================================
import { ProductRestController } from './infrastructure/adapters/in/controllers/product-rest.controller';

// ============================================
// ADAPTERS (TCP, WebSockets)
// ============================================
import { ProductWebSocketGateway } from './infrastructure/adapters/out/product-websocket.gateway';
import { SedeTcpProxy } from './infrastructure/adapters/out/TCP/sede-tcp.proxy';

@Module({
  imports: [
    // Registrar entities de TypeORM
    TypeOrmModule.forFeature([
      ProductOrmEntity,
      StockOrmEntity,
      CategoryOrmEntity,
      AlmacenOrmEntity,
      UnidadOrmEntity,
    ]),

    ClientsModule.register([
      {
        name: 'SEDE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.SEDE_SERVICE_HOST || '127.0.0.1',
          port: Number(process.env.SEDE_SERVICE_PORT || 3011),
        },
      },
    ]),
  ],

  controllers: [ProductRestController],

  providers: [
    ProductTypeOrmRepository,
    {
      provide: 'IProductRepositoryPort',
      useExisting: ProductTypeOrmRepository,
    },

    ProductQueryService,
    ProductCommandService,

    ProductWebSocketGateway,
    SedeTcpProxy,
  ],

  exports: [ProductQueryService, ProductCommandService],
})
export class ProductModule {}
