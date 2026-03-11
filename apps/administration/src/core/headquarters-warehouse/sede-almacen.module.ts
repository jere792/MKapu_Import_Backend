import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HeadquartersModule } from '../headquarters/headquarters.module';
import { SedeAlmacenOrmEntity } from './infrastructure/entity/sede-almacen-orm.entity';
import { SedeAlmacenRepository } from './infrastructure/adapters/out/repository/sede-almacen.repository';
import { SedeAlmacenCommandService } from './application/service/sede-almacen-command.service';
import { SedeAlmacenQueryService } from './application/service/sede-almacen-query.service';
import { SedeAlmacenRestController } from './infrastructure/adapters/in/controllers/sede-almacen-rest.controller';
import { AlmacenClientProvider } from './infrastructure/adapters/out/TCP/almacen-client.provider';
import { AlmacenTcpProxy } from './infrastructure/adapters/out/TCP/almacen-tcp.proxy';
import { HeadquartersOrmEntity } from '../headquarters/infrastructure/entity/headquarters-orm.entity';
import { SedeAlmacenTcpController } from '../sede-almacen/infrastructure/adapters/in/TCP/sede-almacen-tcp.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SedeAlmacenOrmEntity, HeadquartersOrmEntity]),
    ConfigModule,
    HeadquartersModule,
  ],
  controllers: [SedeAlmacenRestController, SedeAlmacenTcpController],
  providers: [
    AlmacenClientProvider,
    AlmacenTcpProxy,
    {
      provide: 'ISedeAlmacenRepositoryPort',
      useClass: SedeAlmacenRepository,
    },
    {
      provide: 'ISedeAlmacenCommandPort',
      useClass: SedeAlmacenCommandService,
    },
    {
      provide: 'ISedeAlmacenQueryPort',
      useClass: SedeAlmacenQueryService,
    },
    {
      provide: 'IWarehouseGatewayPort',
      useExisting: AlmacenTcpProxy,
    },
  ],
  exports: ['ISedeAlmacenCommandPort', 'ISedeAlmacenQueryPort'],
})
export class SedeAlmacenModule {}
