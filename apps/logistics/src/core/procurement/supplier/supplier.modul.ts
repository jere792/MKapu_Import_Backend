/* ============================================
   logistics/src/core/procurement/supplier/supplier.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure - Entity
import { SupplierOrmEntity } from './infrastructure/entity/supplier-orm.entity';

// Infrastructure - Adapters IN
import { SupplierRestController } from './infrastructure/adapters/in/controllers/supplier-rest.controller';

// Infrastructure - Adapters OUT
import { SupplierRepository } from './infrastructure/adapters/out/repository/supplier.repository';

// Application - Services
import { SupplierCommandService } from './application/service/supplier-command.service';
import { SupplierQueryService } from './application/service/supplier-query.service';

@Module({
  imports: [
    // Registrar la entidad ORM
    TypeOrmModule.forFeature([SupplierOrmEntity]),
  ],
  controllers: [
    // Adapter IN - REST Controller
    SupplierRestController,
  ],
  providers: [
    // Adapter OUT - Repository
    {
      provide: 'ISupplierRepositoryPort',
      useClass: SupplierRepository,
    },

    // Application - Command Service
    {
      provide: 'ISupplierCommandPort',
      useClass: SupplierCommandService,
    },

    // Application - Query Service
    {
      provide: 'ISupplierQueryPort',
      useClass: SupplierQueryService,
    },
  ],
  exports: [
    'ISupplierCommandPort',
    'ISupplierQueryPort',
  ],
})
export class SupplierModule {}