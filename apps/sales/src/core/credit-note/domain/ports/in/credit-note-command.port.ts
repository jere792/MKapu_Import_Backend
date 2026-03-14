import { AnnulCreditNoteDto } from "../../../application/dto/in/annul-credit-note.dto";
import { RegisterCreditNoteDto } from "../../../application/dto/in/register-credit-note.dto";
import { CreditNoteDeletedResponseDto } from "../../../application/dto/out/credit-note-deleted-response.dto";
import { CreditNoteResponseDto } from "../../../application/dto/out/credit-note-response.dto";

export interface IRegisterCreditNoteCommandPort {
    execute(payload: RegisterCreditNoteDto): Promise<CreditNoteResponseDto>;
}

export interface IAnnulCreditNoteCommandPort {
    execute(payload: AnnulCreditNoteDto): Promise<CreditNoteDeletedResponseDto>;
}

