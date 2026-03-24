import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CustomerModule } from '../customer/customer.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { QuoteOrmEntity } from './infrastructure/entity/quote-orm.entity';
import { CustomerOrmEntity } from '../customer/infrastructure/entity/customer-orm.entity';
import { QuoteDetailOrmEntity } from './infrastructure/entity/quote-orm-detail.entity';
import { QuoteController } from './infrastructure/adapters/in/controllers/quote-rest.controller';
import { QuoteTcpController } from './infrastructure/adapters/in/TCP/quote-tcp.controller';
import { QuoteTypeOrmRepository } from './infrastructure/adapters/out/repository/quote-typeorm.repository';
import { QuoteCommandService } from './application/service/quote-command.service';
import { QuoteQueryService } from './application/service/quote-query.service';
import { ProductStockTcpClientProvider } from './infrastructure/providers/product-stock-tcp-client.provider';
import { ProductStockTcpProxy } from './infrastructure/adapters/out/TCP/ProductStockTcpProxy';
import { SedeTcpProxy } from './infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { SupplierTcpProxy } from './infrastructure/adapters/out/TCP/SupplierTcpProxy';
import { EmpresaTcpProxy } from '../sales-receipt/infrastructure/adapters/out/TCP/empresa-tcp.proxy';
import { UsersTcpProxy } from '../sales-receipt/infrastructure/adapters/out/TCP/users-tcp.proxy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule,
    TypeOrmModule.forFeature([
      QuoteOrmEntity,
      CustomerOrmEntity,
      QuoteDetailOrmEntity,
    ]),
    CustomerModule,
    ClientsModule.register([
      {
        name: 'SEDE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ADMIN_HOST || 'localhost',
          port: Number(process.env.ADMIN_PORT) || 3011,
        },
      },
      {
        name: 'ADMIN_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ADMIN_HOST || 'localhost',
          port: Number(process.env.ADMIN_PORT) || 3011,
        },
      },
      {
        name: 'LOGISTICS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.LOGISTICS_TCP_HOST || 'localhost',
          port: Number(process.env.LOGISTICS_TCP_PORT) || 5005,
        },
      },
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ADMINISTRATION_HOST || 'localhost',
          port: Number(process.env.ADMINISTRATION_TCP_PORT) || 3011,
        },
      },
    ]),
  ],
  controllers: [QuoteController, QuoteTcpController],
  providers: [
    UsersTcpProxy,
    ProductStockTcpClientProvider,
    ProductStockTcpProxy,
    SedeTcpProxy,
    SupplierTcpProxy,
    QuoteQueryService,
    {
      provide: 'IQuoteCommandPort',
      useClass: QuoteCommandService,
    },
    {
      provide: 'IQuoteQueryPort',
      useClass: QuoteQueryService,
    },
    {
      provide: 'IQuoteRepositoryPort',
      useClass: QuoteTypeOrmRepository,
    },
    {
      provide: 'ISedeProxy',
      useClass: SedeTcpProxy,
    },
    {
      provide: 'ISupplierProxy',
      useClass: SupplierTcpProxy,
    },
    {
      provide: 'IEmpresaProxy',
      useClass: EmpresaTcpProxy,
    },
  ],
  exports: [
    'IQuoteCommandPort',
    'IQuoteQueryPort',
    'ISedeProxy',
    'ISupplierProxy',
    'IEmpresaProxy',
  ],
})
export class QuoteModule {}
