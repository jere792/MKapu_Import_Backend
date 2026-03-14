/* ============================================
   administration/src/core/role/role.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { RoleOrmEntity } from './infrastructure/entity/role-orm.entity';
import { RoleWebSocketGateway } from './infrastructure/adapters/out/role-websocket.gateway';

// Application
import { RoleCommandService } from './application/service/role-command.service';
import { RoleQueryService } from './application/service/role-query.service';
import { RoleRestController } from './infrastructure/adapters/in/controllers/role-rest.controller';
import { RoleRepository } from './infrastructure/adapters/out/repository/role.repository';
import { RolePermissionModule } from '../role-permission/role-permission.module';

@Module({
  imports: [
    // Registrar la entidad ORM
    TypeOrmModule.forFeature([RoleOrmEntity]),
  ],
  controllers: [RoleRestController],
  providers: [
    RoleWebSocketGateway,
    {
      provide: 'IRoleRepositoryPort',
      useClass: RoleRepository,
    },

    {
      provide: 'IRoleCommandPort',
      useClass: RoleCommandService,
    },

    {
      provide: 'IRoleQueryPort',
      useClass: RoleQueryService,
    },
  ],
  exports: ['IRoleCommandPort', 'IRoleQueryPort', RoleWebSocketGateway],
})
export class RoleModule {}
