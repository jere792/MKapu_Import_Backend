import { TypeCreditResponseDto } from "./type-credit-response-dto";

export interface TypeCreditNoteListResponse {
    typeCreditNotes: TypeCreditResponseDto[];
    total: number;
    page?: number;
    pageSize?: number;
}