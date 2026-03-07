import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleOrmEntity }           from '../role/infrastructure/entity/role-orm.entity';
import { PermissionOrmEntity }     from '../permission/infrastructure/entity/permission-orm.entity';
import { RolePermissionOrmEntity } from './infrastructure/entity/role-permission-orm.entity';

import { RolePermissionRepository }      from './infrastructure/adapters/out/repository/role-permission.repository';
import { RolePermissionCommandService }  from './application/service/role-permission-command.service';
import { RolePermissionQueryService }    from './application/service/role-permission-query.service';
import { RolePermissionRestController }  from './infrastructure/adapters/in/controllers/role-permission-rest.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleOrmEntity,
      PermissionOrmEntity,
      RolePermissionOrmEntity,
    ]),
  ],
  controllers: [RolePermissionRestController],
  providers: [
    {
      provide:  'IRolePermissionRepositoryPort',
      useClass: RolePermissionRepository,
    },
    {
      provide:  'IRolePermissionCommandPort',
      useClass: RolePermissionCommandService,
    },
    {
      provide:  'IRolePermissionQueryPort',
      useClass: RolePermissionQueryService,
    },
  ],
  exports: [
    'IRolePermissionCommandPort',
    'IRolePermissionQueryPort',
  ],
})
export class RolePermissionModule {}