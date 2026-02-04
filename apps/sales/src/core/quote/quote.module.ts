/* apps/sales/src/core/quote/quote.module.ts */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from '../customer/customer.module';

// Entidades e Infraestructura
import { QuoteOrmEntity } from './infrastructure/entity/quote-orm.entity';
import { CustomerOrmEntity } from './infrastructure/entity/customer-orm.entity';
import { QuoteController } from './infrastructure/adapters/in/controllers/quote-rest.controller';
import { QuoteTypeOrmRepository } from './infrastructure/adapters/out/repository/quote-typeorm.repository';

// Aplicación (Servicios)
import { QuoteCommandService } from './application/service/quote-command.service';
import { QuoteQueryService } from './application/service/quote-query.service';

@Module({
  imports: [
    // Registramos las entidades para este módulo
    TypeOrmModule.forFeature([QuoteOrmEntity, CustomerOrmEntity]),
    CustomerModule,
  ],
  controllers: [
    QuoteController,
  ],
  providers: [
    // Inyección de Comandos (Puerto de Entrada)
    {
      provide: 'IQuoteCommandPort',
      useClass: QuoteCommandService,
    },

    // Inyección de Consultas (Puerto de Entrada)
    {
      provide: 'IQuoteQueryPort',
      useClass: QuoteQueryService,
    },

    // Inyección del Repositorio (Puerto de Salida)
    {
      provide: 'IQuoteRepositoryPort',
      useClass: QuoteTypeOrmRepository,
    },
  ],
  exports: [
    'IQuoteCommandPort',
    'IQuoteQueryPort',
  ],
})
export class QuoteModule {}