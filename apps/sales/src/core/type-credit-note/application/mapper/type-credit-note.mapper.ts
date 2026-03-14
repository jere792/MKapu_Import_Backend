import { TypeCreditNote } from "../../domain/entity/type-credit-note-domain.entity";
import { TypeCreditNoteOrmEntity } from "../../infrastructure/entity/type-credit-note-orm.entity";
import { RegisterTypeCreditNoteDto } from "../dto/in/register-type-credit-note-dto";
import { UpdateTypeCreditNoteDto } from "../dto/in/update-type-credit-note-dto";
import { TypeCreditNoteDeletedResponseDto } from "../dto/out/type-credit-note-deleted-response-dto";
import { TypeCreditNoteListResponse } from "../dto/out/type-credit-note-list-response";
import { TypeCreditResponseDto } from "../dto/out/type-credit-response-dto";

export class TypeCreditNoteMapper {
    static toResponseDto(typeCreditNote: TypeCreditNote): TypeCreditResponseDto {
        return {
            id_nota: typeCreditNote.id!,
            codigo_sunat: typeCreditNote.codigo,
            descripcion: typeCreditNote.descripcion,
        }
    }

    static toListResponse(typeCreditNotes: TypeCreditNote[]): TypeCreditNoteListResponse {
        return {
            typeCreditNotes: typeCreditNotes.map(t => this.toResponseDto(t)),
            total: typeCreditNotes.length,
        }
    }

    static fromCreateDto(dto: RegisterTypeCreditNoteDto): TypeCreditNote {
        return TypeCreditNote.create({
            codigo_sunat: dto.codigo_sunat,
            descripcion: dto.descripcion,
        });
    }

    static fromUpdateDto(typeCreditNote: TypeCreditNote, dto: UpdateTypeCreditNoteDto): TypeCreditNote {
        return TypeCreditNote.create({
            id_tipo_nota: typeCreditNote.id,
            codigo_sunat: dto.codigo_sunat,
            descripcion: dto.descripcion,
        });
    }

    static toDeletedResponseDto(id_nota: number): TypeCreditNoteDeletedResponseDto {
        return {
            id_nota,
            message: `Tipo de nota de crédito con ID ${id_nota} ha sido eliminado exitosamente.`,
            deletedAt: new Date()
        }
    }

    static toDomainEntity(typeCreditNoteOrm: TypeCreditNoteOrmEntity): TypeCreditNote {
        return TypeCreditNote.create({
            id_tipo_nota: typeCreditNoteOrm.id_tipo_nota,
            codigo_sunat: typeCreditNoteOrm.codigo_sunat,
            descripcion: typeCreditNoteOrm.descripcion,
        });
    }

    static toOrmEntity(typeCreditNote: TypeCreditNote): TypeCreditNoteOrmEntity {
        const ormEntity = new TypeCreditNoteOrmEntity();

        ormEntity.id_tipo_nota = typeCreditNote.id;
        ormEntity.codigo_sunat = typeCreditNote.codigo;
        ormEntity.descripcion = typeCreditNote.descripcion;
        
        return ormEntity;
    }

}