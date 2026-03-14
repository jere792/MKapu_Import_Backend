import { CreditNote } from "../../domain/entity/credit-note-domain-entity";
import { CreditNoteItemProps, CreditNoteProps } from "../../domain/entity/credit-note.props";
import { CreditNoteBusinessType, CreditNoteStatus } from "../../domain/entity/credit-note.types";
import { PaginatedResult } from "../../domain/models/paginated-result";
import { CreditNoteItemOrmEntity } from "../../infrastructure/persistence/entity/credit-note-item-orm.entity";
import { CreditNoteOrmEntity } from "../../infrastructure/persistence/entity/credit-note-orm.entity";
import { RegisterCreditNoteItemDto } from "../dto/in/register-credit-note-item.dto";
import { RegisterCreditNoteDto } from "../dto/in/register-credit-note.dto";
import { CreditNoteDeletedResponseDto } from "../dto/out/credit-note-deleted-response.dto";
import { CreditNoteDetailDto } from "../dto/out/credit-note-detail.dto";
import { CreditNoteListResponseDto } from "../dto/out/credit-note-list-response.dto";
import { CreditNoteResponseDto } from "../dto/out/credit-note-response.dto";
import { CreditNoteSummaryDto } from "../dto/out/credit-note-summary.dto";

export class CreditNoteMapper {
    static toResponseDto(domain: CreditNote): CreditNoteResponseDto {
        return {
            noteId: domain.noteId!,
            //serie: domain.serie,
            //numberDoc: domain.numberDoc,
            correlative: domain.correlative,
            currency: domain['props'].currency,
            totalAmount: domain['props'].totalAmount,
            issueDate: domain['props'].issueDate,
            status: domain.status
        }
    }

    static toSummaryDto(domain: CreditNote): CreditNoteSummaryDto {
        return {
            noteSummaryId: domain.noteId!,
            correlative: domain.correlative,
            customerName: domain.clientName,
            currency: domain.currency,
            emissionDate: domain['props'].issueDate,
            totalAmount: domain['props'].totalAmount,
            status: domain.status
        }
    }

    static toListResponse(result: PaginatedResult<CreditNote>): CreditNoteListResponseDto {
        return {
            data: result.data.map(this.toSummaryDto),
            total: result.total,
            page: result.page,
            limit: result.limit
        }
    }

    static toDetailDto(domain: CreditNote): CreditNoteDetailDto {
        return {
            noteDetailId: domain.noteId!,
            serie: domain.serie,
            numberDoc: domain.numberDoc,
            correlative: domain.correlative,
            issueDate: domain['props'].issueDate,
            customerId: domain['props'].clientId,
            customerName: domain['props'].clientName,
            currency: domain['props'].currency,
            saleValue: domain['props'].saleValue,
            isc: domain['props'].isc,
            igv: domain['props'].igv,
            totalAmount: domain['props'].totalAmount,
            businessType: domain['props'].businessType,
            status: domain.status,
            items: domain.items.map(p => ({
                itemId: p.productId,
                description: p.description,
                quantity: p.quantity,
                unitPrice: p.unitPrice,
                subtotal: p.subtotal,
                igv: p.igv,
                total: p.total
            }))
        }
    }

    static toDeletedResponse(id: number): CreditNoteDeletedResponseDto {
        return {
            noteId: id,
            message: `Nota de credito con ID ${id} anulada correctamente.`,
            status: CreditNoteStatus.REVERSED,
            deletedAt: new Date()
        }
    }

    static fromCreateDto(dto: RegisterCreditNoteDto): CreditNote {
        const props: CreditNoteProps = {
            receiptIdRef: dto.receiptIdRef,
            serieRef: dto.serieRef,
            numberDocRef: dto.numberDocRef,
            serie: dto.serie,
            numberDoc: dto.numberDoc,
            correlative: dto.correlative,
            issueDate: dto.issueDate,
            clientId: dto.clientId,
            clientName: dto.clientName,
            currency: dto.currency,
            typeNoteId: dto.typeNoteId,
            saleValue: dto.saleValue,
            isc: dto.isc,
            igv: dto.igv,
            totalAmount: dto.totalAmount,
            businessType: dto.businessType as CreditNoteBusinessType,
            status: dto.status as CreditNoteStatus,
            userRefId: dto.userRefId,
            userRefName: dto.userRefName,
            headquarterId: dto.headquarterId,
            headquarterName: dto.headquarterName,
            items: dto.items.map((i: RegisterCreditNoteItemDto) => ({
                productId: i.itemId,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                subtotal: i.subtotal,
                igv: i.igv,
                total: i.total
            }))
        };

        return CreditNote.create(props); 
    }
}