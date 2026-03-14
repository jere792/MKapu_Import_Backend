export interface CreditNoteFilter {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    serie?: string;
    numberDoc?: string;
    serieRef?: string;
    numberDocRef?: string;
    page?: number;
    limit?: number;
}