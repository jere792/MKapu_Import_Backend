import { CreditNoteBusinessType, CreditNoteStatus } from "./credit-note.types";

export interface CreditNoteItemProps {
    productId?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    igv: number;
    total: number;
}

export interface CreditNoteProps {
    noteId?: number;
    receiptIdRef: number;
    serieRef: string;
    numberDocRef: number;
    serie: string;
    numberDoc: number;
    correlative: string;
    issueDate: Date; // se puede manejar como createdAt
    clientId: number;
    clientName: string;
    currency: string;
    typeNoteId: number;
    saleValue: number;
    isc: number;
    igv: number;
    totalAmount: number;
    businessType: CreditNoteBusinessType,
    status: CreditNoteStatus;
    userRefId: number;
    userRefName: string;
    headquarterId: number;
    headquarterName: string;
    createdAt?: Date;
    items: CreditNoteItemProps[];
}