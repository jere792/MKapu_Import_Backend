// administration/src/core/user/user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { UserOrmEntity } from './infrastructure/entity/user-orm.entity';
import { CuentaUsuarioOrmEntity } from './infrastructure/entity/cuenta-usuario-orm.entity';
import { CuentaRolOrmEntity } from './infrastructure/entity/cuenta-rol-orm.entity';
import { RoleOrmEntity } from '../role/infrastructure/entity/role-orm.entity';
import { HeadquartersOrmEntity } from '../headquarters/infrastructure/entity/headquarters-orm.entity';

// Controllers
import { UserRestController } from './infrastructure/adapters/in/controllers/user-rest.controller';
import { UsersTcpController } from './infrastructure/adapters/in/TCP/users-tcp.controller';

// Services
import { UserCommandService } from './application/service/user-command.service';
import { UserQueryService } from './application/service/user-query.service';

// Gateway & Repository
import { UserWebSocketGateway } from './infrastructure/adapters/out/user-websocket.gateway';
import { UserRepository } from './infrastructure/adapters/out/repository/user.repository';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserOrmEntity,
      CuentaUsuarioOrmEntity,
      CuentaRolOrmEntity,
      RoleOrmEntity,
      HeadquartersOrmEntity,
    ]),
  ],
  controllers: [
    UserRestController,
  ],
  providers: [
    UserWebSocketGateway,
    UsersTcpController,

    { provide: 'IUserRepositoryPort', useClass: UserRepository },
    { provide: 'IUserCommandPort',    useClass: UserCommandService },
    { provide: 'IUserQueryPort',      useClass: UserQueryService },
  ],
  exports: ['IUserCommandPort', 'IUserQueryPort', UserWebSocketGateway],
})
export class UserModule {}