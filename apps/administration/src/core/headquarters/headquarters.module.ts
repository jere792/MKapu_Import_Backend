import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeadquartersOrmEntity } from './infrastructure/entity/headquarters-orm.entity';
import { SedeAlmacenOrmEntity } from '../sede-almacen/infrastructure/entity/sede-almacen-orm.entity'; // ← agregar import
import { HeadquarterRestController } from './infrastructure/adapters/in/controllers/headquarters-rest.controller';
import { HeadquarterWebSocketGateway } from './infrastructure/adapters/out/headquarters-websocket.gateway';
import { HeadquarterRepository } from './infrastructure/adapters/out/repository/headquarters.repository';
import { HeadquartersCommandService } from './application/service/headquarters-command.service';
import { HeadquartersQueryService } from './application/service/headquarters-query.service';
import { SedeTcpController } from './infrastructure/adapters/in/TCP/sede.tcp.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HeadquartersOrmEntity,
      SedeAlmacenOrmEntity,  
    ]),
  ],
  controllers: [HeadquarterRestController, SedeTcpController],
  providers: [
    HeadquarterWebSocketGateway,
    {
      provide: 'IHeadquartersRepositoryPort',
      useClass: HeadquarterRepository,
    },
    {
      provide: 'IHeadquartersCommandPort',
      useClass: HeadquartersCommandService,
    },
    {
      provide: 'IHeadquartersQueryPort',
      useClass: HeadquartersQueryService,
    },
  ],
  exports: [
    'IHeadquartersCommandPort',
    'IHeadquartersQueryPort',
    HeadquarterWebSocketGateway,
  ],
})
export class HeadquartersModule {}