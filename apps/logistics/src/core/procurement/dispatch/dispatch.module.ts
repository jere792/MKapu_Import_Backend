import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchOrmEntity } from './infrastructure/entity/dispatch-orm.entity';
import { DispatchDetailOrmEntity } from './infrastructure/entity/dispatch-detail-orm.entity';
import { DispatchCommandService } from './application/service/dispatch-command.service';
import { DispatchQueryService } from './application/service/dispatch-query.service';
import { DispatchRepository } from './infrastructure/adapters/out/repository/dispatch.repository';
import { DispatchRestController } from './infrastructure/adapters/in/controller/dispatch.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DispatchOrmEntity, DispatchDetailOrmEntity]),
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
      useFactory: (repository: DispatchRepository) =>
        new DispatchQueryService(repository),
      inject: ['IDispatchOutputPort'],
    },
  ],
  exports: ['IDispatchInputPort', 'IDispatchQueryPort'],
})
export class DispatchModule {}