import { CreditNoteBusinessType, CreditNoteStatus } from "../../../../domain/entity/credit-note.types";

export type CreditNoteGatewayPayload = {
    id: number;
    correlative: string;
    status: CreditNoteStatus;
    businessType: CreditNoteBusinessType,
    clientName: string;
    totalAmount: number;
    emissionDate: string
};

export type CreditNoteGatewayEventPayload = {
    message: string;
    creditNote: CreditNoteGatewayPayload;
    emittedAt: string;
}