/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { ISalesReceiptCommandPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { IPaymentRepositoryPort } from '../../domain/ports/out/payment-repository-ports-out';
import { LogisticsStockProxy } from '../../infrastructure/adapters/out/TCP/logistics-stock.proxy';

import { RegisterSalesReceiptDto, AnnulSalesReceiptDto } from '../dto/in';
import {
  SalesReceiptDeletedResponseDto,
  SalesReceiptResponseDto,
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';
import { SalesReceiptOrmEntity } from '../../infrastructure/entity/sales-receipt-orm.entity';

@Injectable()
export class SalesReceiptCommandService implements ISalesReceiptCommandPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject('IPaymentRepositoryPort')
    private readonly paymentRepository: IPaymentRepositoryPort,
    private readonly stockProxy: LogisticsStockProxy,
  ) {}

  async updateDispatchStatus(
    id_venta: number,
    status: string,
  ): Promise<boolean> {
    try {
      const sale = await this.receiptRepository.findById(id_venta);

      if (!sale) {
        console.error(
          `[SalesCommandService] Venta ${id_venta} no encontrada para actualizar despacho.`,
        );
        return false;
      }

      await this.receiptRepository.updateStatus(id_venta, status);

      console.log(
        `[SalesCommandService] Estado de despacho de venta ${id_venta} actualizado a: ${status}`,
      );
      return true;
    } catch (error) {
      console.error(
        `[SalesCommandService] Error al actualizar estado de despacho:`,
        error,
      );
      return false;
    }
  }

  async registerReceipt(
    dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) throw new NotFoundException(`Cliente no existe.`);

    const assignedSerie = this.getAssignedSerie(dto.receiptTypeId);
    const queryRunner = this.receiptRepository.getQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedReceiptDomain;

    try {
      const nextNumber = await this.receiptRepository.getNextNumberWithLock(
        assignedSerie,
        queryRunner,
      );

      const receipt = SalesReceiptMapper.fromRegisterDto(
        { ...dto, serie: assignedSerie },
        nextNumber,
      );
      receipt.validate();

      const receiptOrm = SalesReceiptMapper.toOrm(receipt);
      const savedOrm = await queryRunner.manager.save(
        SalesReceiptOrmEntity,
        receiptOrm,
      );

      const tipoMovimiento = dto.receiptTypeId === 3 ? 'EGRESO' : 'INGRESO';

      await this.paymentRepository.savePaymentInTransaction(
        {
          id_comprobante: savedOrm.id_comprobante,
          id_tipo_pago: dto.paymentMethodId,
          monto: savedOrm.total,
        },
        queryRunner,
      );

      await this.paymentRepository.registerCashMovementInTransaction(
        {
          idCaja: String(dto.branchId),
          idTipoPago: dto.paymentMethodId,
          tipoMov: tipoMovimiento,
          concepto: `${tipoMovimiento === 'INGRESO' ? 'VENTA' : 'NC'}: ${receipt.getFullNumber()}`,
          monto: savedOrm.total,
        },
        queryRunner,
      );

      await queryRunner.commitTransaction();

      savedReceiptDomain = SalesReceiptMapper.toDomain(savedOrm);

      if (dto.receiptTypeId !== 3) {
        for (const item of receipt.items) {
          try {
            await this.stockProxy.registerMovement({
              productId: Number(item.productId),
              warehouseId: Number(dto.branchId),
              headquartersId: Number(dto.branchId),
              quantityDelta: -item.quantity,
              reason: 'VENTA',
              refId: savedOrm.id_comprobante,
            });
          } catch (error) {
            await this.annulReceiptDueToStockFailure(savedOrm.id_comprobante);
            throw new BadRequestException(
              `Fallo de Inventario: ${error.message}`,
            );
          }
        }
      }
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return SalesReceiptMapper.toResponseDto(savedReceiptDomain);
  }

  /**
   * Método Privado de Compensación CORREGIDO
   * Solo actualiza el estado a ANULADO sin tocar las relaciones
   */
  private async annulReceiptDueToStockFailure(receiptId: number): Promise<void> {
    const queryRunner = this.receiptRepository.getQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.query(
        'UPDATE comprobante_venta SET estado = ? WHERE id_comprobante = ?',
        ['ANULADO', receiptId],
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      console.error(
        `🚨 ERROR CRÍTICO: Fallo al compensar venta ${receiptId}`,
        err,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async annulReceipt(
    dto: AnnulSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(
      dto.receiptId,
    );
    if (!existingReceipt)
      throw new NotFoundException(`ID ${dto.receiptId} no encontrado.`);

    const annulledReceipt = existingReceipt.anular();
    const savedReceipt = await this.receiptRepository.update(annulledReceipt);

    if (existingReceipt.id_tipo_comprobante !== 3) {
      for (const item of savedReceipt.items) {
        this.stockProxy.registerMovement({
          productId: Number(item.productId),
          warehouseId: savedReceipt.id_sede_ref,
          headquartersId: savedReceipt.id_sede_ref,
          quantityDelta: item.quantity,
          reason: `ANULACION: ${savedReceipt.getFullNumber()}`,
        });
      }
    }
    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

  async deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(id);
    if (!existingReceipt)
      throw new NotFoundException(`ID ${id} no encontrado.`);
    await this.receiptRepository.delete(id);
    return {
      receiptId: id,
      message: 'Comprobante eliminado.',
      deletedAt: new Date(),
    };
  }

  private getAssignedSerie(receiptTypeId: number): string {
    const seriesMap: Record<number, string> = {
      1: 'F001',
      2: 'B001',
      3: 'NC01',
    };
    return seriesMap[receiptTypeId] || 'T001';
  }
}
