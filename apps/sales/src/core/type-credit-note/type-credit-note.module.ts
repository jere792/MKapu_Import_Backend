import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeCreditNoteOrmEntity } from "./infrastructure/entity/type-credit-note-orm.entity";
import { TypeCreditRestController } from "./infrastructure/adapters/in/controllers/type-credit-note-rest.controller";
import { TypeCreditNoteWebSocketGateway } from "./infrastructure/adapters/out/type-credit-note-websocket.gateway";
import { TypeCreditNoteRepository } from "./infrastructure/adapters/out/repository/type-credit-note.repository";
import { TypeCreditNoteCommandService } from "./application/service/type-credit-note-command.service";
import { TypeCreditNoteQueryService } from "./application/service/type-credit-note-query.service";

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([
        TypeCreditNoteOrmEntity
    ])],
    controllers: [TypeCreditRestController],
    providers: [
        TypeCreditNoteWebSocketGateway,
        {
            provide: 'ITypeCreditNoteRepositoryPort',
            useClass: TypeCreditNoteRepository,
        },
        {
            provide: 'ITypeCreditNoteCommandPort',
            useClass: TypeCreditNoteCommandService,
        },
        {
            provide: 'ITypeCreditNoteQueryPort',
            useClass: TypeCreditNoteQueryService,
        }
    ],
    exports: ['ITypeCreditNoteCommandPort', 'ITypeCreditNoteQueryPort', TypeCreditNoteWebSocketGateway]
})
export class TypeCreditNoteModule {}