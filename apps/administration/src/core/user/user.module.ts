import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { UserOrmEntity } from './infrastructure/entity/user-orm.entity';

// TCP handlers / guards
import { UsersTcpController } from './infrastructure/adapters/in/TCP/users-tcp.controller';
import { InternalSecretGuard } from './infrastructure/adapters/in/guards/internal-secret.guard';

import { UserCommandService } from './application/service/user-command.service';
import { UserQueryService } from './application/service/user-query.service';
import { UserRestController } from './infrastructure/adapters/in/controllers/user-rest.controller';
import { UserRepository } from './infrastructure/adapters/out/repository/user.repository';
import { UserWebSocketGateway } from './infrastructure/adapters/out/user-websocket.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserRestController], 
  providers: [
    UserWebSocketGateway,

    UsersTcpController,
    InternalSecretGuard,

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