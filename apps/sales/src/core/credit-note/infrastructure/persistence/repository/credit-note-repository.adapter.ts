import { InjectRepository } from "@nestjs/typeorm";
import { ICreditNoteRepositoryPort } from "../../../domain/ports/out/credit-note-repository-out";
import { CreditNoteOrmEntity } from "../entity/credit-note-orm.entity";
import { QueryRunner, Repository } from "typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";
import { CreditNote } from "../../../domain/entity/credit-note-domain-entity";
import { CreditNoteFilter } from "../../../domain/models/credit-note-filter";
import { PaginatedResult } from "../../../domain/models/paginated-result";
import { CreditNoteOrmMapper } from "../mapper/credit-note-orm.mapper";
import { CreditNoteStatus } from "../../../domain/entity/credit-note.types";

@Injectable()
export class CreditNoteRepositoryAdapter implements ICreditNoteRepositoryPort {
    constructor(@InjectRepository(CreditNoteOrmEntity) private readonly repository: Repository<CreditNoteOrmEntity>) { }

    async findByReceiptId(receiptId: number): Promise<CreditNote[]> {
        const entities = await this.repository.find({
            where: { receiptIdRef: receiptId },
            relations: ['items']
        });

        return entities.map(CreditNoteOrmMapper.toDomainEntity);
    }

    async create(creditNote: CreditNote, queryRunner?: QueryRunner): Promise<CreditNote> {
        const ormEntity = CreditNoteOrmMapper.toOrmEntity(creditNote);

        const manager = queryRunner ? queryRunner.manager : this.repository.manager;
        const saved = await manager.save(CreditNoteOrmEntity, ormEntity);

        return CreditNoteOrmMapper.toDomainEntity(saved);
    }

    async getNextCreditNoteNumberWithLock(serie: string, queryRunner: QueryRunner): Promise<number> {
        const result = await queryRunner.manager.query(
            `
            SELECT numero_documento
            FROM nota_credito
            WHERE serie = ?
            ORDER BY numero_documento DESC
            LIMIT 1
            FOR UPDATE
            `,
            [serie]
        );

        if (result.length === 0) {
            return 1;
        }

        return Number(result[0].number) + 1;
    }

    async save(creditNote: CreditNote): Promise<CreditNote> {
        return await this.repository.manager.transaction(async manager => {
            const ormEntity = CreditNoteOrmMapper.toOrmEntity(creditNote);
            const saved = await manager.save(CreditNoteOrmEntity, ormEntity);

            return CreditNoteOrmMapper.toDomainEntity(saved);
        })
    }

    async findById(creditNoteId: number): Promise<CreditNote | null> {
        const entity = await this.repository.findOne({
            where: { creditNoteId },
            relations: ['items']
        });

        if (!entity) return null;

        return CreditNoteOrmMapper.toDomainEntity(entity);
    }

    async findAll(filters: CreditNoteFilter): Promise<PaginatedResult<CreditNote>> {

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const offset = (page - 1) * limit;

        const queryBuilder = this.repository.createQueryBuilder('cn');

        if (filters.startDate) {
            queryBuilder.andWhere('cn.issueDate >= :startDate', {
                startDate: filters.startDate
            });
        }

        if (filters.endDate) {
            queryBuilder.andWhere('cn.issueDate <= :endDate', {
                endDate: filters.endDate
            });
        }

        if (filters.status) {
            queryBuilder.andWhere('cn.status = :status', {
                status: filters.status
            });
        }

        if (filters.serie) {
            queryBuilder.andWhere('cn.serie = :serie', {
                serie: filters.serie
            });
        }

        if (filters.numberDoc) {
            queryBuilder.andWhere('cn.numberDoc = :numberDoc', {
                numberDoc: filters.numberDoc
            });
        }

        if (filters.serieRef) {
            queryBuilder.andWhere('cn.serieRef = :serieRef', {
                serieRef: filters.serieRef
            });
        }

        if (filters.numberDocRef) {
            queryBuilder.andWhere('cn.numberDocRef = :numberDocRef', {
                numberDocRef: filters.numberDocRef
            });
        }

        queryBuilder.orderBy('cn.issueDate', 'DESC').skip(offset).take(limit);

        const [entities, total] = await queryBuilder.getManyAndCount();

        return {
            data: entities.map(CreditNoteOrmMapper.toDomainEntity),
            total,
            page,
            limit
        }
    }

    async annulById(noteId: number): Promise<void> {
        const creditNote = await this.repository.findOne({
            where: {
                creditNoteId: noteId
            }
        });

        if (!creditNote) throw new NotFoundException('Nota no encontrada.');

        if (creditNote.status === CreditNoteStatus.REVERSED) {
            throw new Error('La nota ya esta revertida.');
        }

        creditNote.status = CreditNoteStatus.REJECTED;

        await this.repository.save(creditNote);
    }

    async deleteById(noteId: number): Promise<void> {
        await this.repository.delete(noteId);
    }
}