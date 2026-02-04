/* ============================================
   sales/src/core/customer/customer.module.ts
   ============================================ */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomerOrmEntity } from './infrastructure/entity/customer-orm.entity';
import { DocumentTypeOrmEntity } from './infrastructure/entity/document-type-orm.entity';
import { CustomerRestController } from './infrastructure/adapters/in/controllers/customer-rest.controller';

import { CustomerCommandService } from './application/service/customer-command.service';
import { CustomerQueryService } from './application/service/customer-query.service';

import { CustomerRepository } from './infrastructure/adapters/out/repository/customer.repository';
import { DocumentTypeRepository } from './infrastructure/adapters/out/repository/document.type.reporsitoy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrmEntity,
      DocumentTypeOrmEntity, 
    ]),
  ],
  controllers: [CustomerRestController],
  providers: [
    // Command Service
    {
      provide: 'ICustomerCommandPort',
      useClass: CustomerCommandService,
    },
    CustomerCommandService,

    // Query Service
    {
      provide: 'ICustomerQueryPort',
      useClass: CustomerQueryService,
    },
    CustomerQueryService,

    // Customer Repository
    {
      provide: 'ICustomerRepositoryPort',
      useClass: CustomerRepository,
    },

    // Tipo Documento Repository
    {
      provide: 'IDocumentTypeRepositoryPort',
      useClass: DocumentTypeRepository,
    },
  ],
  exports: [
    'ICustomerCommandPort',
    'ICustomerQueryPort',
    'ICustomerRepositoryPort',     
    'IDocumentTypeRepositoryPort',  
    CustomerCommandService,
    CustomerQueryService,
  ],
})
export class CustomerModule {}