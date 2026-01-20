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

// Application
import { UserCommandService } from './application/service/user-command.service';
import { UserQueryService } from './application/service/user-query.service';

@Module({
  imports: [
    // Registrar la entidad ORM
    TypeOrmModule.forFeature([UserOrmEntity]),
  ],
  controllers: [
    // REST Controller para POST, PUT, DELETE
    UserRestController,
  ],
  providers: [
    // WebSocket Gateway para GET
    UserWebSocketGateway,

    // Repository - Implementación del puerto OUT
    {
      provide: 'IUserRepositoryPort',
      useClass: UserRepository,
    },

    // Command Service - Implementación del puerto IN (Comandos)
    {
      provide: 'IUserCommandPort',
      useClass: UserCommandService,
    },

    // Query Service - Implementación del puerto IN (Consultas)
    {
      provide: 'IUserQueryPort',
      useClass: UserQueryService,
    },
  ],
  exports: [
    // Exportar servicios para que otros módulos puedan usarlos
    'IUserCommandPort',
    'IUserQueryPort',
    UserWebSocketGateway,
  ],
})
export class UserModule {}