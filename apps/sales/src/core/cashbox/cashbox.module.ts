/* ============================================
   administration/src/core/cashbox/cashbox.module.ts
   ============================================ */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades e Infraestructura
import { CashboxOrmEntity } from './infrastructure/entity/cashbox-orm.entity';
import { CashboxController } from './infrastructure/adapters/in/controllers/cashbox.controller';
import { CashboxTypeOrmRepository } from './infrastructure/adapters/out/repository/cashbox-typeorm.repository';
import { CashboxWebSocketGateway } from './infrastructure/adapters/out/cashbox-websocket.gateway';

// Aplicación (Servicios)
import { CashboxCommandService } from './application/service/cashbox-comand.service';
import { CashboxQueryService } from './application/service/cashbox-query.service';

@Module({
  imports: [
    // Registramos la entidad para que TypeORM cree la tabla 'cajas'
    TypeOrmModule.forFeature([CashboxOrmEntity]),
  ],
  controllers: [
    CashboxController,
  ],
  providers: [
    // Gateway para Sockets (Namespace: /cashbox)
    CashboxWebSocketGateway,

    // Inyección de Comandos (Puerto de Entrada)
    {
      provide: 'ICashboxCommandPort',
      useClass: CashboxCommandService,
    },

    // Inyección de Consultas (Puerto de Entrada)
    {
      provide: 'ICashboxQueryPort',
      useClass: CashboxQueryService,
    },

    // Inyección del Repositorio (Puerto de Salida)
    {
      provide: 'ICashboxRepositoryPort',
      useClass: CashboxTypeOrmRepository,
    },
  ],
  // Exportamos el Gateway por si otros módulos necesitan emitir eventos de caja
  exports: [
    'ICashboxCommandPort',
    'ICashboxQueryPort',
  ],
})
export class CashboxModule {}