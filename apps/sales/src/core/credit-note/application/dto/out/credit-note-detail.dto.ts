import { CreditNoteDetailItemDto } from './credit-note-detail-item.dto';

export class CreditNoteDetailDto {
  noteDetailId: number;
  serie: string;
  numberDoc: number;
  correlative: string;
  issueDate: Date;
  emissionDate?: Date;
  status: string;
  businessType: string;

  serieRef: string;
  numberDocRef: string;

  customerId: number;
  customerName: string;
  customerDocument: string;

  currency: string;
  saleValue: number;
  isc: number;
  igv: number;
  totalAmount: number;

  items: CreditNoteDetailItemDto[];
}
