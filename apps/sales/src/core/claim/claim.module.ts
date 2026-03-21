import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClaimOrmEntity } from './infrastructure/entity/claim-orm.entity';
import { SalesReceiptOrmEntity } from '../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { ClaimRestController } from './infrastructure/adapters/in/controllers/claims.controller';
import {
  CLAIM_COMMAND_PORT,
  CLAIM_QUERY_PORT,
} from './domain/ports/in/claim-port-in';
import { ClaimTypeormRepository } from './infrastructure/adapters/out/repository/claim-typeorm.repository';
import { ClaimCommandService } from './application/service/claim-command.service';
import { ClaimQueryService } from './application/service/claim-query.service';
import { CLAIM_PORT_OUT } from './domain/ports/out/claim-port-out';
import { ClaimDetailOrmEntity } from './infrastructure/entity/claim-detail-orm.entity';
import { EmpresaTcpProxy } from '../sales-receipt/infrastructure/adapters/out/TCP/empresa-tcp.proxy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClaimOrmEntity,
      SalesReceiptOrmEntity,
      ClaimDetailOrmEntity,
    ]),
    ClientsModule.register([
      {
        name: 'ADMIN_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ADMIN_HOST || 'localhost',
          port: Number(process.env.ADMIN_PORT) || 3011,
        },
      },
    ]),
  ],
  controllers: [ClaimRestController],
  providers: [
    {
      provide: CLAIM_COMMAND_PORT,
      useClass: ClaimCommandService,
    },
    {
      provide: CLAIM_QUERY_PORT,
      useClass: ClaimQueryService,
    },
    {
      provide: CLAIM_PORT_OUT,
      useClass: ClaimTypeormRepository,
    },
    {
      provide: 'IEmpresaProxy',
      useClass: EmpresaTcpProxy,
    },
  ],
  exports: [CLAIM_COMMAND_PORT, CLAIM_QUERY_PORT],
})
export class ClaimModule {}
