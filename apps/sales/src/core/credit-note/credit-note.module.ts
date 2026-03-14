import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditNoteOrmEntity } from "./infrastructure/persistence/entity/credit-note-orm.entity";
import { CreditNoteItemOrmEntity } from "./infrastructure/persistence/entity/credit-note-item-orm.entity";
import { SalesReceiptModule } from "../sales-receipt/sales-receipt.module";
import { CreditNoteController } from "./infrastructure/adapters/in/http/credit-note.controller";
import { RegisterCreditNoteCommandService } from "./application/service/command/register-credit-note-command.service";
import { AnnulCreditNoteCommandService } from "./application/service/command/annul-credit-note-command.service";
import { GetCreditNoteDetailQueryService } from "./application/service/query/get-credit-note-detail-query.service";
import { ListCreditNoteQueryService } from "./application/service/query/list-credit-note-query.service";
import { CreditNoteRepositoryAdapter } from "./infrastructure/persistence/repository/credit-note-repository.adapter";
import { HeadquarterTcpProxy } from "./infrastructure/adapters/out/tcp/admin/headquarter-tcp.proxy";
import { UserTcpProxy } from "./infrastructure/adapters/out/tcp/admin/users-tcp.proxy";
import { LogisticsStockProxy } from "./infrastructure/adapters/out/tcp/admin/logistics-stock-tcp.proxy";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CreditNoteOrmEntity,
            CreditNoteItemOrmEntity
        ]),
        ClientsModule.registerAsync([
            {
                name: 'LOGISTICS_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('LOGISTICS_HOST', 'localhost'),
                        port: config.get<number>('LOGISTICS_TCP_PORT', 3004),
                    }
                }),
            },
            {
                name: 'ADMIN_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('USERS_TCP_HOST', 'localhost'),
                        port: config.get<number>('USERS_TCP_PORT', 3011),
                    }
                }),
            }
        ]),
        SalesReceiptModule
    ],
    controllers: [CreditNoteController],
    providers: [
        RegisterCreditNoteCommandService,
        AnnulCreditNoteCommandService,
        GetCreditNoteDetailQueryService,
        ListCreditNoteQueryService,

        CreditNoteRepositoryAdapter,

        LogisticsStockProxy,
        UserTcpProxy,
        HeadquarterTcpProxy,

        {
            provide: 'ICreditNoteRepositoryPort',
            useClass: CreditNoteRepositoryAdapter
        },

        {
            provide: 'IRegisterCreditNoteCommandPort',
            useClass: RegisterCreditNoteCommandService
        },

        {
            provide: 'IAnnulCreditNoteCommandPort',
            useClass: AnnulCreditNoteCommandService
        },

        {
            provide: 'IGetCreditNoteDetailQueryPort',
            useClass: GetCreditNoteDetailQueryService
        },

        {
            provide: 'IListCreditNoteQueryPort',
            useClass: ListCreditNoteQueryService
        },
    ],

    exports: [
        RegisterCreditNoteCommandService,
        GetCreditNoteDetailQueryService,
        'ICreditNoteRepositoryPort',
        HeadquarterTcpProxy,
        UserTcpProxy,
        LogisticsStockProxy
    ]
})
export class CreditNoteModule { }