import { TypeCreditNoteFilterDto } from "../../../application/dto/in/list-type-credit-note-filter-dto";
import { RegisterTypeCreditNoteDto } from "../../../application/dto/in/register-type-credit-note-dto";
import { UpdateTypeCreditNoteDto } from "../../../application/dto/in/update-type-credit-note-dto";
import { TypeCreditNoteDeletedResponseDto } from "../../../application/dto/out/type-credit-note-deleted-response-dto";
import { TypeCreditNoteListResponse } from "../../../application/dto/out/type-credit-note-list-response";
import { TypeCreditResponseDto } from "../../../application/dto/out/type-credit-response-dto";

export interface ITypeCreditNoteCommandPort {
    registerTypeCreditNote(dto: RegisterTypeCreditNoteDto): Promise<TypeCreditResponseDto>;
    updateTypeCreditNote(dto: UpdateTypeCreditNoteDto): Promise<TypeCreditResponseDto>;
    deleteTypeCreditNote(id: number): Promise<TypeCreditNoteDeletedResponseDto>;
}

export interface ITypeCreditNoteQueryPort {
    listTypeCreditNotes(filters?: TypeCreditNoteFilterDto): Promise<TypeCreditNoteListResponse>;
    getTypeCreditNoteById(id: number): Promise<TypeCreditResponseDto | null>;
    getAllTypeCreditNotes(): Promise<TypeCreditResponseDto[]>;
    getTypeCreditNoteByCode(code: string): Promise<TypeCreditResponseDto | null>;
}