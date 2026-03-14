import { Inject, Injectable } from "@nestjs/common";
import { IListCreditNoteQueryPort } from "../../../domain/ports/in/credit-note-query.port";
import { ICreditNoteRepositoryPort } from "../../../domain/ports/out/credit-note-repository-out";
import { ListCreditNoteFilterDto } from "../../dto/in/list-credit-note-filter.dto";
import { CreditNoteListResponseDto } from "../../dto/out/credit-note-list-response.dto";
import { CreditNoteMapper } from "../../mapper/credit-note.mapper";


@Injectable()
export class ListCreditNoteQueryService implements IListCreditNoteQueryPort {
    constructor(
        @Inject('ICreditNoteRepositoryPort')
        private readonly repository: ICreditNoteRepositoryPort
    ) { }

    async execute(filters: ListCreditNoteFilterDto): Promise<CreditNoteListResponseDto> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;

        const list = await this.repository.findAll({
            ...filters,
            page,
            limit
        });

        return CreditNoteMapper.toListResponse(list);
    }
}