import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IGetCreditNoteDetailQueryPort } from "../../../domain/ports/in/credit-note-query.port";
import { ICreditNoteRepositoryPort } from "../../../domain/ports/out/credit-note-repository-out";
import { CreditNoteDetailDto } from "../../dto/out/credit-note-detail.dto";
import { CreditNoteMapper } from "../../mapper/credit-note.mapper";

@Injectable()
export class GetCreditNoteDetailQueryService implements IGetCreditNoteDetailQueryPort {
    constructor(
        @Inject('ICreditNoteRepositoryPort')
        private readonly repository: ICreditNoteRepositoryPort
    ) { }

    async execute(noteId: number): Promise<CreditNoteDetailDto> {
        const creditNote = await this.repository.findById(noteId);

        if (!creditNote) {
            throw new NotFoundException('La nota de credito no existe.');
        }

        return CreditNoteMapper.toDetailDto(creditNote);
    }
}