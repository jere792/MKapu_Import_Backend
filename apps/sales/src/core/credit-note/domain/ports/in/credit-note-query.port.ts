import { ListCreditNoteFilterDto } from '../../../application/dto/in/list-credit-note-filter.dto';
import { CreditNoteDetailDto } from '../../../application/dto/out/credit-note-detail.dto';
import { CreditNoteListResponseDto } from '../../../application/dto/out/credit-note-list-response.dto';

export interface IListCreditNoteQueryPort {
  execute(filters: ListCreditNoteFilterDto): Promise<CreditNoteListResponseDto>;
}

export interface IGetCreditNoteDetailQueryPort {
  execute(noteId: number): Promise<CreditNoteDetailDto>;
}
export interface IExportCreditNoteQueryPort {
  execute(filters: ListCreditNoteFilterDto): Promise<Buffer>;
}
