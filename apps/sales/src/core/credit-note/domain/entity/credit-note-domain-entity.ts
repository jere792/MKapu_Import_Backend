import { CreditNoteItemProps, CreditNoteProps } from "./credit-note.props";
import { CreditNoteBusinessType, CreditNoteStatus } from "./credit-note.types";

export class CreditNote {
    private constructor(private readonly props: CreditNoteProps) {}

    static create(props: CreditNoteProps) {
        const { serie, currency, totalAmount } = props;

        if (serie.length != 4) {
            throw new Error('Serie invalida.');
        }

        if (currency.length !== 3) {
            throw new Error('Debe existir al menos un item.');
        }

        if (totalAmount <= 0) {
            throw new Error('Importe total invalido.');
        }

        return new CreditNote(props);
    }

    static createCreditNote(data: Omit<CreditNoteProps, 'noteId' | 'status'>): CreditNote {
        return CreditNote.create({
            ...data,
            status: CreditNoteStatus.ISSUED
        });
    }

    static rehydrate(props: CreditNoteProps): CreditNote {
        return new CreditNote(props);
    }

    get noteId(): number | undefined {
        return this.props.noteId;
    }
    
    get serie(): string {
        return this.props.serie;
    }

    get numberDoc(): number {
        return this.props.numberDoc;
    }

    get numberDocRef(): number {
        return this.props.numberDocRef;
    }

    get correlative(): string {
        return this.props.correlative;
    }

    get clientId(): number {
        return this.props.clientId;
    }

    get clientName(): string {
        return this.props.clientName;
    }

    get issueDate(): Date {
        return this.props.issueDate;
    }

    get currency(): string {
        return this.props.currency;
    }

    get receiptIdRef(): number {
        return this.props.receiptIdRef;
    }

    get typeCreditNoteId(): number {
        return this.props.typeNoteId;
    }

    get serieRef(): string {
        return this.props.serieRef;
    }

    get isc(): number {
        return this.props.isc;
    }

    get igv(): number {
        return this.props.igv;
    }

    get saleValue(): number {
        return this.props.saleValue;
    }

    get totalAmount(): number {
        return this.props.totalAmount;
    }

    get businessType(): CreditNoteBusinessType {
        return this.props.businessType;
    }

    get userRefId(): number {
        return this.props.userRefId;
    }

    get userRefName(): string {
        return this.props.userRefName;
    }

    get headquarterId(): number {
        return this.props.headquarterId;
    }

    get headquarterName(): string {
        return this.props.headquarterName;
    }

    get status(): CreditNoteStatus {
        return this.props.status;
    }

    get items(): CreditNoteItemProps[] {
        return this.props.items;
    }

    // Business Rules: StockMovementType, Total Validation & Cancel CN

    requiresStockMovement(): boolean {
        const { businessType } = this.props;
        
        return (
            businessType === CreditNoteBusinessType.FULL_REFUND || 
            businessType === CreditNoteBusinessType.PARTIAL_REFUND
        );
    }

    validateTotals(): void {
        const { items, totalAmount } = this.props;
        const calculateAmount = items.reduce((acc, item) => acc + item.total, 0); 

        if (Math.abs(calculateAmount - totalAmount) > 0.01) {
            throw new Error('Total inconsistente');
        }
    }

    cancelStep(): CreditNote {
        const { status } = this.props;

        if (status === CreditNoteStatus.REVERSED) {
            throw new Error('La nota ya fue anulada.');
        }

        return CreditNote.create({
            ...this.props,
            status: CreditNoteStatus.REVERSED
        });
    }

    validateItems(): void {
        const { items } = this.props;

        if (!items.length) {
            throw new Error('La nota de credito debe contener items.');
        }
    }

    validateSerie(): void {
        const { serie } = this.props;

        if (!/^[A-Z0-9]{4}$/.test(serie)) {
            throw new Error('Formato de serie invalida. SUNAT exige F001, B001.');
        }
    }
}