/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IRegisterCreditNoteCommandPort } from '../../../domain/ports/in/credit-note-command.port';
import { ICreditNoteRepositoryPort } from '../../../domain/ports/out/credit-note-repository-out';
// 👇 Importamos tu nuevo DTO ligero
import { CreateCreditNoteRequestDto } from '../../dto/in/create-credit-note-request.dto';
import { CreditNoteResponseDto } from '../../dto/out/credit-note-response.dto';
import { LogisticsStockProxy } from '../../../infrastructure/adapters/out/tcp/admin/logistics-stock-tcp.proxy';
import { ISalesReceiptRepositoryPort } from 'apps/sales/src/core/sales-receipt/domain/ports/out/sales_receipt-ports-out';
import { ReceiptStatus } from 'apps/sales/src/core/sales-receipt/domain/entity/sales-receipt-domain-entity';
import { CreditNoteBusinessType } from '../../../domain/entity/credit-note.types';
import { DataSource, QueryRunner } from 'typeorm';
import { CreditNote } from '../../../domain/entity/credit-note-domain-entity';
import { UserTcpProxy } from '../../../infrastructure/adapters/out/tcp/admin/users-tcp.proxy';
import { HeadquarterTcpProxy } from '../../../infrastructure/adapters/out/tcp/admin/headquarter-tcp.proxy';

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

    private readonly dataSource: DataSource,
  ) {}

  async execute(
    payload: CreateCreditNoteRequestDto,
  ): Promise<CreditNoteResponseDto> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener la venta original
      const receipt: any = await this.salesReceiptRepository.findById(
        payload.salesReceiptId,
      );

      if (!receipt) {
        throw new NotFoundException('El comprobante referenciado no existe.');
      }

      if (
        receipt.estado === ReceiptStatus.ANULADO ||
        receipt.status === ReceiptStatus.ANULADO
      ) {
        throw new BadRequestException(
          'No se puede generar una nota de credito de un comprobante anulado.',
        );
      }

      if (receipt.id_tipo_comprobante === 3 || receipt.receiptTypeId === 3) {
        throw new BadRequestException(
          'No se puede generar una nota de credito de otra nota de credito.',
        );
      }

      // 2. Determinar la Serie (Factura -> FC.., Boleta -> BC..)
      const isFactura = receipt.serie.startsWith('F');
      const prefijo = isFactura ? 'FC' : 'BC';
      const sufijoNum = receipt.serie.substring(2);
      const serie = prefijo + sufijoNum;

      const rawNextNumber =
        await this.creditNoteRepository.getNextCreditNoteNumberWithLock(
          serie,
          queryRunner,
        );

      let nextNumber = parseInt(String(rawNextNumber), 10);
      if (isNaN(nextNumber) || nextNumber <= 0) {
        nextNumber = 1;
      }
      const formattedNumber = nextNumber.toString().padStart(8, '0');
      const creditNoteNumber = `${serie}-${formattedNumber}`;

      // 3. Determinar el Tipo de Negocio (Devolución total vs Parcial)
      const isTotalRefund =
        payload.reasonCode === '01' || payload.reasonCode === '06';
      const businessType = isTotalRefund
        ? CreditNoteBusinessType.FULL_REFUND
        : CreditNoteBusinessType.PARTIAL_REFUND;

      // 4. Validaciones de Devoluciones Existentes
      const existingNotes = await this.creditNoteRepository.findByReceiptId(
        payload.salesReceiptId,
      );

      if (businessType === CreditNoteBusinessType.FULL_REFUND) {
        const hasFullRefund = existingNotes.some(
          (note) => note.businessType === CreditNoteBusinessType.FULL_REFUND,
        );
        if (hasFullRefund)
          throw new BadRequestException(
            'El comprobante ya tiene una devolucion total.',
          );
        if (existingNotes.length > 0)
          throw new BadRequestException(
            'No se puede hacer devolucion total porque ya existen devoluciones parciales.',
          );
      }

      let saleValue = 0;
      let totalIgv = 0;
      let totalAmount = 0;
      const finalItems = [];

      const returnedItems = existingNotes.flatMap((n) => n.items);

      const receiptTotal = Number(receipt.total || receipt.totalAmount || 0);

      const rawItemsTotal = receipt.items.reduce(
        (acc: number, it: any) =>
          acc +
          Number(
            it.total ||
              it.totalAmount ||
              Number(it.quantity || it.cantidad || 1) *
                Number(it.unitPrice || it.precio_unitario || it.precio || 0),
          ),
        0,
      );

      const discountFactor =
        receiptTotal > 0 && rawItemsTotal > receiptTotal
          ? receiptTotal / rawItemsTotal
          : 1;

      for (const itemFront of payload.items) {
        const receiptItem = receipt.items.find(
          (r: any) =>
            Number(r.productId || r.id_producto || r.id_prod_ref) ===
            Number(itemFront.itemId),
        );

        if (!receiptItem)
          throw new BadRequestException(
            `Producto ${itemFront.itemId} no pertenece al comprobante.`,
          );

        const originalQty = Number(
          receiptItem.quantity || receiptItem.cantidad || 1,
        );
        const returnedQty = returnedItems
          .filter((i) => Number(i.productId) === Number(itemFront.itemId))
          .reduce((sum, i) => sum + Number(i.quantity), 0);

        const availableToReturn = originalQty - returnedQty;

        if (itemFront.quantity > availableToReturn) {
          throw new BadRequestException(
            `Solo quedan ${availableToReturn} unidades disponibles.`,
          );
        }

        const ratio = itemFront.quantity / originalQty;

        const originalSub = Number(
          receiptItem.subtotal || receiptItem.subTotal || 0,
        );
        const originalIgv = Number(receiptItem.igv || 0);
        const originalTot = Number(
          receiptItem.total || receiptItem.totalAmount || 0,
        );
        const unitPrice = Number(
          receiptItem.unitPrice ||
            receiptItem.precio_unitario ||
            receiptItem.precio ||
            0,
        );

        // Aplicamos el factor de descuento a los montos de la base de datos
        const safeItemTot =
          (originalTot > 0 ? originalTot : unitPrice * originalQty) *
          discountFactor;
        const safeItemSub =
          (originalSub > 0 ? originalSub : safeItemTot / 1.18) * discountFactor;
        const safeItemIgv =
          (originalIgv > 0 ? originalIgv : safeItemTot - safeItemSub) *
          discountFactor;

        const subItem = safeItemSub * ratio;
        const igvItem = safeItemIgv * ratio;
        const totalItem = safeItemTot * ratio;

        saleValue += subItem;
        totalIgv += igvItem;
        totalAmount += totalItem;

        finalItems.push({
          productId:
            receiptItem.productId ||
            receiptItem.id_producto ||
            receiptItem.id_prod_ref,
          description:
            receiptItem.description || receiptItem.descripcion || 'Producto',
          quantity: itemFront.quantity,
          unitPrice: Number((unitPrice * discountFactor).toFixed(2)),
          subtotal: Number(subItem.toFixed(2)),
          igv: Number(igvItem.toFixed(2)),
          total: Number(totalItem.toFixed(2)),
        });
      }

      // REDONDEO Y AJUSTE DE DEVOLUCIÓN TOTAL
      if (isTotalRefund) {
        saleValue = Number(
          receipt.subtotal || receipt.saleValue || receiptTotal / 1.18,
        );
        totalIgv = Number(
          receipt.igv || receipt.totalIgv || receiptTotal - saleValue,
        );
        totalAmount = receiptTotal;
      } else {
        saleValue = Number(saleValue.toFixed(2));
        totalIgv = Number(totalIgv.toFixed(2));
        totalAmount = Number(totalAmount.toFixed(2));
      }

      const returnedTotal = existingNotes.reduce(
        (sum, note) => sum + Number(note.totalAmount),
        0,
      );

      if (returnedTotal + totalAmount > receiptTotal + 0.05) {
        throw new BadRequestException(
          `El monto de devolucion (S/. ${totalAmount}) excede el total original del comprobante (S/. ${receiptTotal}).`,
        );
      }

      const user = await this.userProxy.getUserById(payload.userRefId);
      if (!user) throw new NotFoundException('Usuario no encontrado.');

      const headquarterIdRef = receipt.id_sede_ref || receipt.headquarterId;
      const headquarter =
        await this.headquarterProxy.getHeadquarterById(headquarterIdRef);
      if (!headquarter)
        throw new NotFoundException('Sede de origen no encontrada.');

      // 👇 USAMOS MAPEO EN MEMORIA PARA EVITAR EL ERROR SQL 'Unknown column'
      const sunatToIdMap: Record<string, number> = {
        '01': 1,
        '02': 2,
        '03': 3,
        '04': 4,
        '05': 5,
        '06': 6,
        '07': 7,
        '08': 8,
        '09': 9,
      };

      const finalTypeNoteId = sunatToIdMap[payload.reasonCode];
      const rawClientId =
        receipt.cliente_id || receipt.id_cliente || receipt.clientId;
      let parsedClientId = parseInt(String(rawClientId), 10);
      if (isNaN(parsedClientId) || parsedClientId <= 0) {
        parsedClientId = 1;
      }
      if (!finalTypeNoteId) {
        throw new BadRequestException(
          `El código SUNAT ${payload.reasonCode} no es válido.`,
        );
      }

      const creditNote = CreditNote.createCreditNote({
        receiptIdRef: receipt.id_comprobante || receipt.id,
        serieRef: receipt.serie,
        numberDocRef: receipt.numero || receipt.numberDoc,

        serie,
        numberDoc: nextNumber,
        correlative: creditNoteNumber,

        issueDate: new Date(),

        clientId: parsedClientId,
        clientName: String(
          receipt.nombre_cliente ||
            receipt.clientName ||
            receipt.cliente?.razon_social ||
            'Cliente Genérico',
        ),
        currency: String(receipt.cod_moneda || receipt.currency || 'PEN'),

        // Asignamos el ID directo
        typeNoteId: finalTypeNoteId,

        saleValue: saleValue,
        isc: 0,
        igv: totalIgv,
        totalAmount: totalAmount,

        businessType: businessType,

        userRefId: user.id_usuario,
        userRefName: user.nombreCompleto,

        headquarterId: headquarter.id_sede,
        headquarterName: headquarter.nombre,

        items: finalItems,
      });

      creditNote.validateSerie();
      creditNote.validateItems();
      creditNote.validateTotals();

      await this.creditNoteRepository.create(creditNote, queryRunner);
      const savedNote: any = await this.creditNoteRepository.create(
        creditNote,
        queryRunner,
      );
      const generatedNoteId =
        savedNote?.noteId || savedNote?.id_nota_credito || savedNote?.id || 0;
      if (
        businessType === CreditNoteBusinessType.FULL_REFUND ||
        businessType === CreditNoteBusinessType.PARTIAL_REFUND
      ) {
        for (const item of finalItems) {
          await this.stockProxy.increaseStock(
            item.productId,
            item.quantity,
            generatedNoteId,
            creditNote.headquarterId,
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        noteId: generatedNoteId,
        correlative: creditNoteNumber,
      } as CreditNoteResponseDto;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
