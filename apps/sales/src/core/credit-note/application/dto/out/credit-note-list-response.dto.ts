import { CreditNoteSummaryDto } from "./credit-note-summary.dto";

export class CreditNoteListResponseDto {
    data: CreditNoteSummaryDto[];
    total: number;
    page: number;
    limit: number;
}