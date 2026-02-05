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
    const receipt = await this.receiptRepository.findById(dto.id_comprobante);
    if (!receipt) {
      throw new NotFoundException(
        `Comprobante con ID ${dto.id_comprobante} no encontrado.`,
      );
    }
    const saleDate = new Date(receipt.fec_emision);
    const limitDate = new Date(saleDate);
    limitDate.setDate(limitDate.getDate() + this.WARRANTY_DAYS_LIMIT);
    if (new Date() > limitDate) {
      throw new BadRequestException(
        `La fecha de emisión del comprobante (${saleDate.toISOString().split('T')[0]}) excede el límite de ${this.WARRANTY_DAYS_LIMIT} días para solicitar garantía.`,
      );
    }
    const itemInReceipt = receipt.items.find(
      (item) =>
        item.productId === dto.cod_prod || item.productName === dto.prod_nombre,
    );

    if (!itemInReceipt) {
      throw new BadRequestException(
        `El producto con código ${dto.cod_prod} (${dto.prod_nombre}) no existe en el comprobante indicado.`,
      );
    }
    if (!dto.num_garantia) {
      dto.num_garantia = this.generateWarrantyNumber();
    }
    const warranty = WarrantyMapper.fromRegisterDto(dto);
    warranty.addTracking({
      id_usuario_ref: dto.id_usuario_ref || 'SISTEMA',
      fecha: new Date(),
      estado_anterior: null,
      estado_nuevo: 1,
      observacion: 'Registro inicial de solicitud de garantía',
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
    const updatedWarranty = await this.repository.update(warranty);
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
    if (warranty.id_estado_garantia === 3 && idEstado === 2) {
      throw new BadRequestException(
        'No se puede aprobar una garantía que ya fue rechazada.',
      );
    }
    warranty.changeStatus(idEstado, idUsuario, comentario);
    const updatedWarranty = await this.repository.update(warranty);
    if (idEstado === 2 && resolutionAction) {
      if (resolutionAction === 'REPLACE') {
        await this.logisticsPort.registerProductEntry({
          productId: warranty.cod_prod,
          productName: warranty.prod_nombre,
          quantity: -1,
          storeId: warranty.id_sede_ref,
          warrantyId: warranty.id_garantia,
        });
      } else if (resolutionAction === 'REFUND') {
        const originalReceipt = await this.receiptRepository.findById(
          warranty.id_comprobante,
        );
        const itemPrice =
          originalReceipt?.items.find((i) => i.productId === warranty.cod_prod)
            ?.unitPrice || 0;

        await this.salesPort.generateCreditNote({
          originalReceiptId: warranty.id_comprobante,
          customerId: Number(warranty.id_usuario_recepcion),
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
    // Genera formato: GAR-20231025-X8Z1
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GAR-${datePart}-${randomPart}`;
  }
}
