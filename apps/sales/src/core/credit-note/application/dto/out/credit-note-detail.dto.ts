import { CreditNoteDetailItemDto } from "./credit-note-detail-item.dto";

export class CreditNoteDetailDto {
    noteDetailId: number;
    serie: string;
    numberDoc: number;
    correlative: string;
    issueDate: Date;
    currency: string;
    totalAmount: number;
    saleValue: number;
    status: string;
    emissionDate?: Date;
    businessType: string;
    isc: number;
    igv: number;
    customerId: number;
    customerName: string;
    items: CreditNoteDetailItemDto[];
}