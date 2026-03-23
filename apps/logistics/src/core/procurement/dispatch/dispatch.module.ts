import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DispatchOrmEntity } from './infrastructure/entity/dispatch-orm.entity';
import { DispatchDetailOrmEntity } from './infrastructure/entity/dispatch-detail-orm.entity';
import { DispatchCommandService } from './application/service/dispatch-command.service';
import { DispatchQueryService } from './application/service/dispatch-query.service';
import { DispatchRepository } from './infrastructure/adapters/out/repository/dispatch.repository';
import { DispatchRestController } from './infrastructure/adapters/in/controller/dispatch.controller';

export const SALES_CLIENT = 'SALES_TCP_CLIENT';

@Module({
  imports: [
    TypeOrmModule.forFeature([DispatchOrmEntity, DispatchDetailOrmEntity]),

    // ── Cliente TCP → microservicio Sales ─────────────────────────
    ClientsModule.registerAsync([
      {
        name: SALES_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: cfg.get<string>('SALES_TCP_HOST', 'localhost'),
            port: cfg.get<number>('SALES_TCP_PORT', 3003),
          },
        }),
      },
    ]),
  ],
  controllers: [DispatchRestController],
  providers: [
    {
      provide: 'IDispatchOutputPort',
      useClass: DispatchRepository,
    },
    {
      provide: 'IDispatchInputPort',
      useFactory: (repository: DispatchRepository) =>
        new DispatchCommandService(repository),
      inject: ['IDispatchOutputPort'],
    },
    {
      provide: 'IDispatchQueryPort',
      useFactory: (repository: DispatchRepository, salesClient: any) =>
        new DispatchQueryService(repository, salesClient),
      inject: ['IDispatchOutputPort', SALES_CLIENT],
    },
  ],
  exports: ['IDispatchInputPort', 'IDispatchQueryPort'],
})
export class DispatchModule {}