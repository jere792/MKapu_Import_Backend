/* eslint-disable @typescript-eslint/no-unsafe-call */
/* sales/src/core/warranty/application/service/warranty-command.service.ts */

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterWarrantyDto } from '../dto/in/register-warranty.dto';
import { UpdateWarrantyDto } from '../dto/in/update-warranty.dto';
import {
  IWarrantyLogisticsPort,
  IWarrantyRepositoryPort,
  IWarrantySalesPort,
} from '../../domain/ports/out/warranty-ports-out';
import { ISalesReceiptRepositoryPort } from '../../../sales-receipt/domain/ports/out/sales_receipt-ports-out';
import { WarrantyMapper } from '../mapper/warranty.mapper';
import { WarrantyResponseDto } from '../dto/out/warranty-response.dto';
import { IWarrantyCommandPort } from '../../domain/ports/in/warranty-command-ports-in';

@Injectable()
export class WarrantyCommandService implements IWarrantyCommandPort {
  private readonly WARRANTY_DAYS_LIMIT = 60;

  constructor(
    @Inject('IWarrantyRepositoryPort')
    private readonly repository: IWarrantyRepositoryPort,
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,
    @Inject('IWarrantyLogisticsPort')
    private readonly logisticsPort: IWarrantyLogisticsPort,
    @Inject('IWarrantySalesPort')
    private readonly salesPort: IWarrantySalesPort,
  ) {}

  async registerWarranty(
    dto: RegisterWarrantyDto,
  ): Promise<WarrantyResponseDto> {
    // 1. Validar existencia del comprobante
    const receipt = await this.receiptRepository.findById(dto.id_comprobante);
    if (!receipt) {
      throw new NotFoundException(
        `Comprobante con ID ${dto.id_comprobante} no encontrado.`,
      );
    }

    // 2. Validar límite de tiempo (60 días)
    const saleDate = new Date(receipt.fec_emision);
    const limitDate = new Date(saleDate);
    limitDate.setDate(limitDate.getDate() + this.WARRANTY_DAYS_LIMIT);

    if (new Date() > limitDate) {
      throw new BadRequestException(
        `La fecha de emisión (${saleDate.toISOString().split('T')[0]}) excede el límite de ${this.WARRANTY_DAYS_LIMIT} días.`,
      );
    }

    // 3. Validar que el producto pertenezca al comprobante
    const itemInReceipt = receipt.items.find(
      (item) =>
        item.productId === dto.cod_prod || item.productName === dto.prod_nombre,
    );

    if (!itemInReceipt) {
      throw new BadRequestException(
        `El producto ${dto.cod_prod} no existe en el comprobante indicado.`,
      );
    }

    // 4. Generar número si no viene
    if (!dto.num_garantia) {
      dto.num_garantia = this.generateWarrantyNumber();
    }

    // 5. Crear entidad y tracking inicial
    const warranty = WarrantyMapper.fromRegisterDto(dto);
    warranty.addTracking({
      id_usuario_ref: dto.id_usuario_ref || 'SISTEMA',
      fec_registro: new Date(),
      id_estado: 1, // RECIBIDO
      comentario: 'Registro inicial de solicitud de garantía',
    });

    const savedEntity = await this.repository.save(warranty);
    return WarrantyMapper.toResponseDto(savedEntity);
  }

  async updateWarranty(
    id: number,
    dto: UpdateWarrantyDto,
  ): Promise<WarrantyResponseDto> {
    const warranty = await this.repository.findById(id);
    if (!warranty) {
      throw new NotFoundException(`Garantía con ID ${id} no encontrada.`);
    }

    const isNewReception = !warranty.fec_recepcion && dto.fec_recepcion;

    if (dto.fec_recepcion) {
      warranty.registerReception(new Date(dto.fec_recepcion));
    }

    // Podrías actualizar observaciones si vienen en el DTO
    if (dto.observaciones) {
      warranty.updateObservaciones(dto.observaciones);
    }

    const updatedWarranty = await this.repository.update(warranty);

    // Si es el momento en que físicamente recibimos el producto, notificamos a Logística
    if (isNewReception) {
      await this.logisticsPort.registerProductEntry({
        productId: updatedWarranty.cod_prod,
        productName: updatedWarranty.prod_nombre,
        quantity: 1,
        storeId: updatedWarranty.id_sede_ref,
        warrantyId: updatedWarranty.id_garantia,
      });
    }

    return WarrantyMapper.toResponseDto(updatedWarranty);
  }

  async changeStatus(
    id: number,
    idEstado: number,
    comentario: string,
    idUsuario: string,
    resolutionAction?: 'REFUND' | 'REPLACE',
  ): Promise<WarrantyResponseDto> {
    const warranty = await this.repository.findById(id);
    if (!warranty) {
      throw new NotFoundException(`Garantía con ID ${id} no encontrada.`);
    }

    // Validación de transición de estados (Ejemplo: No pasar de Rechazado a Aprobado directamente)
    if (warranty.id_estado_garantia === 3 && idEstado === 2) {
      throw new BadRequestException(
        'No se puede aprobar una garantía rechazada.',
      );
    }

    // Actualizamos estado y generamos tracking automáticamente
    warranty.changeStatus(idEstado, idUsuario, comentario);

    const updatedWarranty = await this.repository.update(warranty);

    // Lógica de resolución (Logística o Ventas)
    if (idEstado === 2 && resolutionAction) {
      // Supongamos 2 = APROBADO/RESUELTO
      if (resolutionAction === 'REPLACE') {
        // Salida de stock para el nuevo producto de reemplazo
        await this.logisticsPort.registerProductEntry({
          productId: warranty.cod_prod,
          productName: warranty.prod_nombre,
          quantity: -1,
          storeId: warranty.id_sede_ref,
          warrantyId: warranty.id_garantia,
        });
      } else if (resolutionAction === 'REFUND') {
        // Generar Nota de Crédito en el microservicio de Ventas
        const originalReceipt = await this.receiptRepository.findById(
          warranty.id_comprobante,
        );
        const itemPrice =
          originalReceipt?.items.find((i) => i.productId === warranty.cod_prod)
            ?.unitPrice || 0;

        await this.salesPort.generateCreditNote({
          originalReceiptId: warranty.id_comprobante,
          customerId: Number(warranty.id_usuario_recepcion), // Convertimos a Number para la API externa si es necesario
          branchId: warranty.id_sede_ref,
          amount: itemPrice,
          reason: `Resolución de Garantía #${warranty.num_garantia}`,
          items: [
            {
              cod_prod: warranty.cod_prod,
              cantidad: 1,
              price: itemPrice,
            },
          ],
        });
      }
    }

    return WarrantyMapper.toResponseDto(updatedWarranty);
  }

  async deleteWarranty(id: number): Promise<any> {
    const warranty = await this.repository.findById(id);
    if (!warranty) {
      throw new NotFoundException(`Garantía con ID ${id} no encontrada.`);
    }

    if (warranty.id_estado_garantia !== 1) {
      throw new BadRequestException(
        'Solo se pueden eliminar garantías en estado pendiente.',
      );
    }

    await this.repository.delete(id);

    return {
      id_garantia: id,
      message: 'Garantía eliminada correctamente',
      deletedAt: new Date(),
    };
  }

  private generateWarrantyNumber(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GAR-${datePart}-${randomPart}`;
  }
}
