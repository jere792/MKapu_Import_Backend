import { Injectable } from "@nestjs/common";
import { ITypeCreditNoteRepositoryPort } from "../../../../domain/ports/out/type-credit-note-port-out";
import { Repository } from "typeorm";
import { TypeCreditNoteOrmEntity } from "../../../entity/type-credit-note-orm.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeCreditNote } from "../../../../domain/entity/type-credit-note-domain.entity";
import { TypeCreditNoteMapper } from "../../../../application/mapper/type-credit-note.mapper";

@Injectable()
export class TypeCreditNoteRepository implements ITypeCreditNoteRepositoryPort {
    constructor(
        @InjectRepository(TypeCreditNoteOrmEntity)
        private readonly typeCreditNoteOrmRepository: Repository<TypeCreditNoteOrmEntity>
    ) {}

    async save(typeCreditNote: TypeCreditNote): Promise<TypeCreditNote> {
        const typeCreditNoteOrm = TypeCreditNoteMapper.toOrmEntity(typeCreditNote);
        const saved = await this.typeCreditNoteOrmRepository.save(typeCreditNoteOrm);

        return TypeCreditNoteMapper.toDomainEntity(saved);
    }

    async update(typeCreditNote: TypeCreditNote): Promise<TypeCreditNote> {
        const typeCreditNoteOrm = TypeCreditNoteMapper.toOrmEntity(typeCreditNote);

        await this.typeCreditNoteOrmRepository.update(typeCreditNote.id!, typeCreditNoteOrm);
        const updated = await this.findById(typeCreditNote.id!);

        return updated!;
    }

    async delete(id: number): Promise<void> {
        await this.typeCreditNoteOrmRepository.delete(id);
    }

    async findById(id: number): Promise<TypeCreditNote | null> {
        const typeCreditNoteOrm = await this.typeCreditNoteOrmRepository.findOne({ where: { id_tipo_nota: id } });
        if (!typeCreditNoteOrm) {
            return null;
        }

        return typeCreditNoteOrm ? TypeCreditNoteMapper.toDomainEntity(typeCreditNoteOrm) : null;
    }

    async findByCode(code: string): Promise<TypeCreditNote | null> {
        const typeCreditNoteOrm = await this.typeCreditNoteOrmRepository.findOne({ 
            where: { codigo_sunat: code } 
        });

        return typeCreditNoteOrm ? TypeCreditNoteMapper.toDomainEntity(typeCreditNoteOrm) : null;
    }

    async findAll(filters?: { codigo_sunat?: string; }): Promise<TypeCreditNote[]> {
        const queryBuilder = this.typeCreditNoteOrmRepository.createQueryBuilder('type_credit_note');

        if (filters?.codigo_sunat) {
            queryBuilder.andWhere('type_credit_note.codigo_sunat LIKE :codigo', { codigo: `%${filters.codigo_sunat}%` });
        }

        const typeCreditNoteOrms = await queryBuilder.getMany();
        return typeCreditNoteOrms.map(orm => TypeCreditNoteMapper.toDomainEntity(orm));
    }
}