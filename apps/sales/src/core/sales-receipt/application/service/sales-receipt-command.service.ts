/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
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
import {
  SalesReceiptOrmEntity,
  ReceiptStatusOrm,
} from '../../infrastructure/entity/sales-receipt-orm.entity';
import { SedeTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { ReceiptStatus } from '../../domain/entity/sales-receipt-domain-entity';

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
    private readonly sedeTcpProxy: SedeTcpProxy,
    
  ) {}
  async emitReceipt(id: number, paymentTypeId?: number): Promise<SalesReceiptResponseDto> {
    const receipt = await this.receiptRepository.findById(id);
    if (!receipt) throw new NotFoundException(`Comprobante ${id} no encontrado`);
    if (receipt.estado !== ReceiptStatus.PENDIENTE) {
      throw new BadRequestException(`El comprobante no está en estado PENDIENTE`);
    }

    // 1️⃣ Cambiar estado + registrar pago en una sola transacción
    const queryRunner = this.receiptRepository.getQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.query(
        'UPDATE comprobante_venta SET estado = ? WHERE id_comprobante = ?',
        ['EMITIDO', id],
      );

      if (paymentTypeId) {
        await this.paymentRepository.savePaymentInTransaction(
          {
            id_comprobante: id,
            id_tipo_pago:   paymentTypeId,
            monto:          receipt.total,
          },
          queryRunner,
        );

        await this.paymentRepository.registerCashMovementInTransaction(
          {
            idCaja:     String(receipt.id_sede_ref),
            idTipoPago: paymentTypeId,
            tipoMov:    'INGRESO',
            concepto:   `VENTA (crédito saldado): ${receipt.serie}-${receipt.numero}`,
            monto:      receipt.total,
          },
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // 2️⃣ Obtener almacén
    console.log(`🏢 Buscando almacén para sede: ${receipt.id_sede_ref}`);
    const warehouseId = await this.sedeTcpProxy.getAlmacenBySede(receipt.id_sede_ref);
    console.log(`🏭 warehouseId obtenido: ${warehouseId}`);

    if (!warehouseId) {
      await this.annulReceiptDueToStockFailure(id);
      throw new BadRequestException(
        `No hay almacén configurado para la sede ${receipt.id_sede_ref}`,
      );
    }

    // 3️⃣ Descontar stock por cada item
    console.log(`📦 Items a descontar: ${JSON.stringify(receipt.items)}`);
    for (const item of receipt.items) {
      try {
        await this.stockProxy.registerMovement({
          productId:      Number(item.productId),
          warehouseId:    warehouseId,
          headquartersId: Number(receipt.id_sede_ref),
          quantityDelta:  -item.quantity,
          reason:         'VENTA',
          refId:          id,
        });
      } catch (error) {
        await this.annulReceiptDueToStockFailure(id);
        throw new BadRequestException(`Fallo de Inventario: ${error.message}`);
      }
    }

    const updated = await this.receiptRepository.findById(id);
    return SalesReceiptMapper.toResponseDto(updated!);
  }

  async updateDispatchStatus(id_venta: number, status: string): Promise<boolean> {
    try {
      const sale = await this.receiptRepository.findById(id_venta);
      if (!sale) {
        console.error(`[SalesCommandService] Venta ${id_venta} no encontrada.`);
        return false;
      }
      await this.receiptRepository.updateStatus(id_venta, status);
      return true;
    } catch (error) {
      console.error(`[SalesCommandService] Error al actualizar estado:`, error);
      return false;
    }
  }

  async registerReceipt(
    dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    console.log('📥 DTO completo:', JSON.stringify(dto, null, 2));
    console.log('🏢 branchId:', dto.branchId, '| tipo:', typeof dto.branchId);
    console.log('📋 serie recibida:', dto.serie);

    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) throw new NotFoundException(`Cliente no existe.`);

    const assignedSerie = this.getAssignedSerie(dto.receiptTypeId);
    console.log('📋 assignedSerie (getAssignedSerie):', assignedSerie);

    const queryRunner = this.receiptRepository.getQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedReceiptDomain;

    try {
      const nextNumber = await this.receiptRepository.getNextNumberWithLock(
        assignedSerie,
        queryRunner,
      );
      console.log('🔢 nextNumber para serie', assignedSerie, ':', nextNumber);

      const receipt = SalesReceiptMapper.fromRegisterDto(
        { ...dto, serie: assignedSerie },
        nextNumber,
      );
      console.log('🧾 receipt.id_sede_ref:', receipt.id_sede_ref);

      receipt.validate();

      const receiptOrm = SalesReceiptMapper.toOrm(receipt);
      console.log('🗃️ receiptOrm.id_sede_ref:', receiptOrm.id_sede_ref);

      // ── Estado según origen de la venta ─────────────────────────────────
      receiptOrm.estado = dto.esCreditoPendiente
        ? ReceiptStatusOrm.PENDIENTE
        : ReceiptStatusOrm.EMITIDO;
      console.log('📋 estado asignado:', receiptOrm.estado);
      // ────────────────────────────────────────────────────────────────────

      const savedOrm = await queryRunner.manager.save(
        SalesReceiptOrmEntity,
        receiptOrm,
      );
      console.log(
        '💾 savedOrm.id_sede_ref:',
        savedOrm.id_sede_ref,
        '| id:',
        savedOrm.id_comprobante,
      );

      const tipoMovimiento = dto.receiptTypeId === 3 ? 'EGRESO' : 'INGRESO';

      if (!dto.esCreditoPendiente) {

          await this.paymentRepository.savePaymentInTransaction(
            { id_comprobante: savedOrm.id_comprobante, id_tipo_pago: dto.paymentMethodId, monto: savedOrm.total },
            queryRunner,
          );

          await this.paymentRepository.registerCashMovementInTransaction(
            {
              idCaja:     String(dto.branchId),
              idTipoPago: dto.paymentMethodId,
              tipoMov:    tipoMovimiento,
              concepto:   `${tipoMovimiento === 'INGRESO' ? 'VENTA' : 'NC'}: ${receipt.getFullNumber()}`,
              monto:      savedOrm.total,
            },
            queryRunner,
          );
      }

      await queryRunner.commitTransaction();
      savedReceiptDomain = SalesReceiptMapper.toDomain(savedOrm);

      if (dto.receiptTypeId !== 3 && !dto.esCreditoPendiente) {
        const warehouseId = await this.sedeTcpProxy.getAlmacenBySede(
          dto.branchId,
        );
        if (!warehouseId) {
          await this.annulReceiptDueToStockFailure(savedOrm.id_comprobante);
          throw new BadRequestException(
            `No hay almacén configurado para la sede ${dto.branchId}`,
          );
        }
        console.log(`🏭 Sede ${dto.branchId} → Almacén ${warehouseId}`);

        for (const item of receipt.items) {
          try {
            await this.stockProxy.registerMovement({
              productId: Number(item.productId),
              warehouseId: warehouseId,
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

    console.log(
      `sedeId: ${dto.branchId}, receiptId: ${savedReceiptDomain.id_comprobante} - Venta registrada exitosamente.`,
    );
    console.log(
      '📤 Response DTO:',
      JSON.stringify(
        SalesReceiptMapper.toResponseDto(savedReceiptDomain),
        null,
        2,
      ),
    );
    return SalesReceiptMapper.toResponseDto(savedReceiptDomain);
  }

  private async annulReceiptDueToStockFailure(
    receiptId: number,
  ): Promise<void> {
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

    await this.receiptRepository.updateStatus(existingReceipt.id_comprobante, 'RECHAZADO');

    const fueEmitido = existingReceipt.estado === ReceiptStatus.EMITIDO;

    if (fueEmitido && existingReceipt.id_tipo_comprobante !== 3) {
      const warehouseId = await this.sedeTcpProxy.getAlmacenBySede(existingReceipt.id_sede_ref);
      for (const item of existingReceipt.items) {
        this.stockProxy.registerMovement({
          productId: Number(item.productId),
          warehouseId: savedReceipt.id_sede_ref,
          headquartersId: savedReceipt.id_sede_ref,
          quantityDelta: item.quantity,
          reason: `ANULACION: ${savedReceipt.getFullNumber()}`,
        });
      }
    }

    const updated = await this.receiptRepository.findById(existingReceipt.id_comprobante);
    return SalesReceiptMapper.toResponseDto(updated!);
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
