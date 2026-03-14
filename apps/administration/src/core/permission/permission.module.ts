/* ============================================
   administration/src/core/permission/permission.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionOrmEntity } from './infrastructure/entity/permission-orm.entity';
import { PermissionRestController } from './infrastructure/adapters/in/controllers/permission-rest.controller';
import { PermissionWebSocketGateway } from './infrastructure/adapters/out/permission-websocket.gateway';
import { PermissionRepository } from './infrastructure/adapters/out/repository/permisision.repository';
import { PermissionCommandService } from './application/service/permission-command.service';
import { PermissionQueryService } from './application/service/permission-query.service';

import { RoleModule } from '../role/role.module';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionOrmEntity]), RoleModule],
  controllers: [PermissionRestController],
  providers: [
    PermissionWebSocketGateway,

    {
      provide: 'IPermissionRepositoryPort',
      useClass: PermissionRepository,
    },
    {
      provide: 'IPermissionCommandPort',
      useClass: PermissionCommandService,
    },
    {
      provide: 'IPermissionQueryPort',
      useClass: PermissionQueryService,
    },
  ],
  exports: [
    'IPermissionCommandPort',
    'IPermissionQueryPort',
    PermissionWebSocketGateway,
  ],
})
export class PermissionModule {}
