import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IRegisterCreditNoteCommandPort } from "../../../domain/ports/in/credit-note-command.port";
import { ICreditNoteRepositoryPort } from "../../../domain/ports/out/credit-note-repository-out";
import { RegisterCreditNoteDto } from "../../dto/in/register-credit-note.dto";
import { CreditNoteResponseDto } from "../../dto/out/credit-note-response.dto";
import { LogisticsStockProxy } from "../../../infrastructure/adapters/out/tcp/admin/logistics-stock-tcp.proxy";
import { ISalesReceiptRepositoryPort } from "apps/sales/src/core/sales-receipt/domain/ports/out/sales_receipt-ports-out";
import { ReceiptStatus } from "apps/sales/src/core/sales-receipt/domain/entity/sales-receipt-domain-entity";
import { CreditNoteBusinessType } from "../../../domain/entity/credit-note.types";
import { DataSource, QueryRunner } from "typeorm";
import { CreditNote } from "../../../domain/entity/credit-note-domain-entity";
import { UserTcpProxy } from "../../../infrastructure/adapters/out/tcp/admin/users-tcp.proxy";
import { HeadquarterTcpProxy } from "../../../infrastructure/adapters/out/tcp/admin/headquarter-tcp.proxy";

@Injectable()
export class RegisterCreditNoteCommandService implements IRegisterCreditNoteCommandPort {

    constructor(
        @Inject('ICreditNoteRepositoryPort')
        private readonly creditNoteRepository: ICreditNoteRepositoryPort,

        @Inject('ISalesReceiptRepositoryPort')
        private readonly salesReceiptRepository: ISalesReceiptRepositoryPort,

        private readonly stockProxy: LogisticsStockProxy,
        private readonly userProxy: UserTcpProxy,
        private readonly headquarterProxy: HeadquarterTcpProxy,

        private readonly dataSource: DataSource
    ) { }

    async execute(payload: RegisterCreditNoteDto): Promise<CreditNoteResponseDto> {

        const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            const serie = "N001";

            const receipt = await this.salesReceiptRepository.findById(payload.receiptIdRef);

            const nextNumber =
                await this.creditNoteRepository.getNextCreditNoteNumberWithLock(
                    serie,
                    queryRunner
                );

            const formattedNumber = nextNumber.toString().padStart(8, '0');
            const creditNoteNumber = `${serie}-${formattedNumber}`;

            if (!receipt) {
                throw new NotFoundException('El comprobante referenciado no existe.');
            }

            if (receipt.estado === ReceiptStatus.ANULADO) {
                throw new BadRequestException(
                    'No se puede generar una nota de credito de un comprobante anulado.'
                );
            }

            if (receipt.id_tipo_comprobante === 3) {
                throw new BadRequestException(
                    'No se puede generar una nota de credito de otra nota de credito.'
                );
            }

            const existingNotes =
                await this.creditNoteRepository.findByReceiptId(payload.receiptIdRef);

            /**
             * DEVOLUCION TOTAL
             */

            if (payload.businessType === CreditNoteBusinessType.FULL_REFUND) {

                const hasFullRefund = existingNotes.some(
                    note => note.businessType === CreditNoteBusinessType.FULL_REFUND
                );

                if (hasFullRefund) {
                    throw new BadRequestException(
                        'El comprobante ya tiene una devolucion total.'
                    );
                }

                if (existingNotes.length > 0) {
                    throw new BadRequestException(
                        'No se puede hacer devolucion total porque ya existen devoluciones parciales.'
                    );
                }
            }

            /**
             * DEVOLUCION PARCIAL
             */

            if (payload.businessType === CreditNoteBusinessType.PARTIAL_REFUND) {

                const returnedItems = existingNotes.flatMap(n => n.items);

                for (const item of payload.items) {

                    const receiptItem = receipt.items.find(
                        r => Number(r.productId) === Number(item.itemId)
                    );

                    if (!receiptItem) {
                        throw new BadRequestException(
                            `Producto ${item.itemId} no pertenece al comprobante.`
                        );
                    }

                    const returnedQty = returnedItems
                        .filter(i => Number(i.productId) === Number(item.itemId))
                        .reduce((sum, i) => sum + i.quantity, 0);

                    const availableToReturn = receiptItem.quantity - returnedQty;

                    if (item.quantity > availableToReturn) {
                        throw new BadRequestException(
                            `Solo quedan ${availableToReturn} unidades disponibles para devolver del producto ${item.itemId}.`
                        );
                    }
                }
            }

            /**
             * VALIDACION MONTO
             */

            const returnedTotal = existingNotes.reduce(
                (sum, note) => sum + note.totalAmount,
                0
            );

            if (returnedTotal + payload.totalAmount > receipt.total) {
                throw new BadRequestException(
                    'El monto de devolucion excede el total del comprobante.'
                );
            }

            /**
             * SNAPSHOTS
             */

            const user = await this.userProxy.getUserById(payload.userRefId);

            if (!user) {
                throw new NotFoundException("Usuario no encontrado.");
            }

            const headquarter =
                await this.headquarterProxy.getHeadquarterById(payload.headquarterId);

            if (!headquarter) {
                throw new NotFoundException("Sede no encontrada.");
            }


            const clientId = Number(receipt.id_cliente) || payload.clientId;

            if (!clientId || Number.isNaN(clientId)) {
                throw new BadRequestException(
                    `El id_cliente ${receipt.id_cliente} no es válido`
                );
            }

            const creditNote = CreditNote.createCreditNote({

                receiptIdRef: payload.receiptIdRef,
                serieRef: payload.serieRef,
                numberDocRef: payload.numberDocRef,

                serie,
                numberDoc: nextNumber,
                correlative: creditNoteNumber,

                issueDate: new Date(),

                clientId,
                clientName: receipt.nombre_cliente ?? payload.clientName,

                currency: receipt.cod_moneda ?? payload.currency,

                typeNoteId: payload.typeNoteId,

                saleValue: payload.saleValue,
                isc: payload.isc,
                igv: payload.igv,
                totalAmount: payload.totalAmount,

                businessType: payload.businessType,

                userRefId: user.id_usuario,
                userRefName: user.nombreCompleto,

                headquarterId: headquarter.id_sede,
                headquarterName: headquarter.nombre,

                items: payload.items.map(i => ({
                    productId: i.itemId,
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    subtotal: i.subtotal,
                    igv: i.igv,
                    total: i.total
                }))
            });

            creditNote.validateSerie();
            creditNote.validateItems();
            creditNote.validateTotals();

            await this.creditNoteRepository.create(creditNote, queryRunner);

            /**
             * ACTUALIZAR STOCK
             */

            if (
                payload.businessType === CreditNoteBusinessType.FULL_REFUND ||
                payload.businessType === CreditNoteBusinessType.PARTIAL_REFUND
            ) {
                for (const item of payload.items) {
                    await this.stockProxy.increaseStock(
                        item.itemId,
                        item.quantity,
                        creditNote.noteId,
                        creditNote.headquarterId
                    );
                }
            }

            await queryRunner.commitTransaction();

            return {
                noteId: creditNote.noteId,
                correlative: creditNoteNumber
            } as CreditNoteResponseDto;

        } catch (error) {

            await queryRunner.rollbackTransaction();
            throw error;

        } finally {

            await queryRunner.release();

        }
    }
}