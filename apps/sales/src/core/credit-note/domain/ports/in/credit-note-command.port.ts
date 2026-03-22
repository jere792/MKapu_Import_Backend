import { AnnulCreditNoteDto } from '../../../application/dto/in/annul-credit-note.dto';
import { CreateCreditNoteRequestDto } from '../../../application/dto/in/create-credit-note-request.dto';
import { RegisterCreditNoteDto } from '../../../application/dto/in/register-credit-note.dto';
import { CreditNoteDeletedResponseDto } from '../../../application/dto/out/credit-note-deleted-response.dto';
import { CreditNoteResponseDto } from '../../../application/dto/out/credit-note-response.dto';

export interface IRegisterCreditNoteCommandPort {
  execute(payload: CreateCreditNoteRequestDto): Promise<CreditNoteResponseDto>;
}

export interface IAnnulCreditNoteCommandPort {
  execute(payload: AnnulCreditNoteDto): Promise<CreditNoteDeletedResponseDto>;
}
