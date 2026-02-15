import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WastageOrmEntity } from './infrastructure/entity/wastage-orm.entity';
import { WastageDetailOrmEntity } from './infrastructure/entity/wastage-detail.orm.entity';
import { WastageTypeOrmEntity } from './infrastructure/entity/wastage-type.orm.entity';
import { WastageRestController } from './infrastructure/adapters/in/controllers/wastage-rest.controller';
import { WastageCommandService } from './application/service/wastage-command.service';
import { WastageQueryService } from './application/service/wastage-query.service';
import { WastageTypeOrmRepository } from './infrastructure/adapters/out/repository/wastage-typeorm.repository';
import { UsersClientProvider } from './infrastructure/adapters/out/TCP/users-client.provider';
import { UsuarioTcpProxy } from './infrastructure/adapters/out/TCP/usuario-tcp.proxy';
import { InventoryModule } from '../../warehouse/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WastageOrmEntity,
      WastageDetailOrmEntity,
      WastageTypeOrmEntity
    ]),
    InventoryModule,
  ],
  controllers: [WastageRestController],
  providers: [
    UsersClientProvider,    
    UsuarioTcpProxy,       
    WastageCommandService,
    WastageQueryService,
    { provide: 'IWastageCommandPort', useClass: WastageCommandService },
    { provide: 'IWastageQueryPort', useClass: WastageQueryService },
    { provide: 'IWastageRepositoryPort', useClass: WastageTypeOrmRepository },
  ],
  exports: [WastageCommandService, 'IWastageCommandPort'],
})
export class WastageModule {}