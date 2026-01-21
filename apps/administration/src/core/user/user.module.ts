/* ============================================
   administration/src/core/user/user.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { UserOrmEntity } from './infrastructure/entity/user-orm.entity';
import { UserRepository } from './infrastructure/repository/user.repository';
import { UserRestController } from './infrastructure/controllers/user-rest.controller';
import { UserWebSocketGateway } from './infrastructure/adapters/user-websocket.gateway';

import { UserCommandService } from './application/service/user-command.service';
import { UserQueryService } from './application/service/user-query.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserRestController],
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
