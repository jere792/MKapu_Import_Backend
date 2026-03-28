// terms-conditions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TerminosCondicionesRepository,
} from './infrastructure/adapters/out/repository/terminos-condiciones.repository';
import { TerminosCondicionesMapper } from './application/mapper/terminos-condiciones.mapper';
import { TerminosCondicionesQuery }  from './application/service/query/terminos-condiciones.query';
import { TerminosCondicionesCommand } from './application/service/command/terminos-condiciones.command';
import { TerminosCondicionesController,
} from './infrastructure/adapters/in/controller/terminos-condiciones.controller';
import { TERMINOS_REPOSITORY_PORT }  from './domain/ports/out/terminos-condiciones.repository.port';
import { TerminosCondicionesEntity } from './infrastructure/entity/terms-conditions.entity';
import { TerminosSeccionEntity } from './infrastructure/entity/terms-section.entity';
import { TerminosParrafoEntity } from './infrastructure/entity/terms-paragraph.entity';
import { TerminosItemEntity } from './infrastructure/entity/terms-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TerminosCondicionesEntity,
      TerminosSeccionEntity,
      TerminosParrafoEntity,
      TerminosItemEntity,
    ]),
  ],
  controllers: [TerminosCondicionesController],
  providers: [
    { provide: TERMINOS_REPOSITORY_PORT, useClass: TerminosCondicionesRepository },
    TerminosCondicionesMapper,
    TerminosCondicionesQuery,
    TerminosCondicionesCommand,
  ],
  exports: [TerminosCondicionesQuery],
})
export class TerminosCondicionesModule {}