/* ============================================
   administration/src/core/user/user.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './infrastructure/entity/user-orm.entity';

import { UserCommandService } from './application/service/user-command.service';
import { UserQueryService } from './application/service/user-query.service';
import { UserRestController } from './infrastructure/adapters/in/controllers/user-rest.controller';
import { UserRepository } from './infrastructure/adapters/out/repository/user.repository';
import { UserWebSocketGateway } from './infrastructure/adapters/out/user-websocket.gateway';
import { UserTcpController } from './infrastructure/adapters/in/TCP/user-tcp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserRestController, UserTcpController],
  providers: [
    UserWebSocketGateway,

    {
      provide: 'IUserRepositoryPort',
      useClass: UserRepository,
    },

    {
      provide: 'IUserCommandPort',
      useClass: UserCommandService,
    },

    {
      provide: 'IUserQueryPort',
      useClass: UserQueryService,
    },
  ],
  exports: ['IUserCommandPort', 'IUserQueryPort', UserWebSocketGateway],
})
export class UserModule {}
