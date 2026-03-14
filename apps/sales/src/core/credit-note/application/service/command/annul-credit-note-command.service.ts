import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IAnnulCreditNoteCommandPort } from "../../../domain/ports/in/credit-note-command.port";
import { ICreditNoteRepositoryPort } from "../../../domain/ports/out/credit-note-repository-out";
import { AnnulCreditNoteDto } from "../../dto/in/annul-credit-note.dto";
import { CreditNoteDeletedResponseDto } from "../../dto/out/credit-note-deleted-response.dto";
import { CreditNoteMapper } from "../../mapper/credit-note.mapper";
import { CreditNoteStatus } from "../../../domain/entity/credit-note.types";

@Injectable()
export class AnnulCreditNoteCommandService implements IAnnulCreditNoteCommandPort {
    constructor(
        @Inject('ICreditNoteRepositoryPort')
        private readonly repository: ICreditNoteRepositoryPort
    ) {}

    async execute(payload: AnnulCreditNoteDto): Promise<CreditNoteDeletedResponseDto> {
        const creditNote = await this.repository.findById(payload.creditNoteId);

        if (!creditNote) {
            throw new NotFoundException('No se encontro la nota de credito.');
        }

        if (creditNote.status === CreditNoteStatus.REVERSED) {
            throw new BadRequestException('La nota de credito ya se encuentra anulada.');
        } 

        await this.repository.annulById(payload.creditNoteId);

        return CreditNoteMapper.toDeletedResponse(payload.creditNoteId);
    }
}