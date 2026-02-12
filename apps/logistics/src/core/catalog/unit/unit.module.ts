import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOrmEntity } from './infrastructure/entity/unit-orm.entity';
import { UnitRepository } from './infrastructure/adapters/out/unit.repository';
import { UnitRestController } from './infrastructure/adapters/in/unit-rest.controller';
import { UnitCommandService } from './application/service/unit-command.service';

@Module({
  imports: [TypeOrmModule.forFeature([UnitOrmEntity])],
  controllers: [UnitRestController],
  providers: [
    UnitCommandService,
    {
      provide: 'UnitPortsOut',
      useClass: UnitRepository,
    },
    {
      provide: 'UnitPortsIn',
      useClass: UnitCommandService,
    },
  ],
  exports: ['UnitPortsOut', TypeOrmModule, UnitCommandService],
})
export class UnitModule {}
