import { CreditNote } from "../../../domain/entity/credit-note-domain-entity";
import { CreditNoteItemProps, CreditNoteProps } from "../../../domain/entity/credit-note.props";
import { CreditNoteBusinessType, CreditNoteStatus } from "../../../domain/entity/credit-note.types";
import { CreditNoteItemOrmEntity } from "../entity/credit-note-item-orm.entity";
import { CreditNoteOrmEntity } from "../entity/credit-note-orm.entity";

export class CreditNoteOrmMapper {
    static toOrmEntity(domain: CreditNote): CreditNoteOrmEntity {
        const orm = new CreditNoteOrmEntity();

        orm.creditNoteId = domain.noteId;
        orm.receiptIdRef = domain.receiptIdRef;
        orm.serieRef = domain.serieRef;
        orm.numberDocRef = domain.numberDocRef;
        orm.serie = domain.serie;
        orm.numberDoc = domain.numberDoc;
        orm.correlative = domain.correlative,
        orm.issueDate = domain.issueDate;
        orm.clientId = domain.clientId;
        orm.clientName = domain.clientName;
        orm.currency = domain.currency;
        orm.typeNoteId = domain.typeCreditNoteId;
        orm.saleValue = domain.saleValue;
        orm.isc = domain.isc;
        orm.igv = domain.igv;
        orm.totalAmount = domain.totalAmount;
        orm.businessType = domain.businessType;
        orm.status = domain.status;
        orm.userRefId = domain.userRefId;
        orm.userRefName = domain.userRefName; 
        orm.headquarterId = domain.headquarterId;
        orm.headquarterName = domain.headquarterName;

        orm.items = this.toOrmItems(domain.items, orm);

        return orm;
    }

    static toOrmItems(items: CreditNoteItemProps[], creditNote: CreditNoteOrmEntity): CreditNoteItemOrmEntity[] {
        return items.map(item => {
            const ormItem = new CreditNoteItemOrmEntity();

            ormItem.productId = item.productId;
            ormItem.description = item.description;
            ormItem.quantity = item.quantity;
            ormItem.unitPrice = item.unitPrice;
            ormItem.subtotal = item.subtotal;
            ormItem.igv = item.igv;
            ormItem.total = item.total;

            ormItem.creditNote = creditNote;

            return ormItem;
        });
    }

    static toDomainEntity(orm: CreditNoteOrmEntity): CreditNote {
        const props: CreditNoteProps = {
            noteId: orm.creditNoteId,
            receiptIdRef: orm.receiptIdRef,
            serieRef: orm.serieRef,
            numberDocRef: orm.numberDocRef,
            serie: orm.serie,
            numberDoc: orm.numberDoc,
            correlative: orm.correlative,
            issueDate: orm.issueDate,
            clientId: orm.clientId,
            clientName: orm.clientName,
            currency: orm.currency,
            typeNoteId: orm.typeNoteId,
            saleValue: orm.saleValue,
            isc: orm.isc,
            igv: orm.igv,
            totalAmount: orm.totalAmount,
            businessType: orm.businessType as CreditNoteBusinessType,
            status: orm.status as CreditNoteStatus,
            userRefId: orm.userRefId,
            userRefName: orm.userRefName,
            headquarterId: orm.headquarterId,
            headquarterName: orm.headquarterName,

            items: orm.items?.map((i) => ({
                productId: i.productId,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                subtotal: i.subtotal,
                igv: i.igv,
                total: i.total
            })) ?? []
        };

        return CreditNote.create(props);
    }
}
