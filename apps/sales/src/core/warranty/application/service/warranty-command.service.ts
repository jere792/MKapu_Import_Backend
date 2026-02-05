import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IWarrantyCommandPort } from '../../domain/ports/in/warranty-command-ports-in';
import { RegisterWarrantyDto } from '../dto/in/register-warranty.dto';
import { UpdateWarrantyDto } from '../dto/in/update-warranty.dto';
import {
  WarrantyDeleteResponseDto,
  WarrantyResponseDto,
} from '../dto/out/warranty-response.dto';
import { IWarrantyRepositoryPort } from '../../domain/ports/out/warranty-ports-out';
import { ISalesReceiptRepositoryPort } from '../../../sales-receipt/domain/ports/out/sales_receipt-ports-out';
import { WarrantyMapper } from '../mapper/warranty.mapper';

@Injectable()
export class WarrantyCommandService implements IWarrantyCommandPort {
  constructor(
    @Inject('IWarrantyRepositoryPort')
    private readonly repository: IWarrantyRepositoryPort,
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,
  ) {}
  async registerWarranty(
    dto: RegisterWarrantyDto,
  ): Promise<WarrantyResponseDto> {
    const receipt = await this.receiptRepository.findById(dto.id_comprobante);
    if (!receipt) {
      throw new Error(
        `Comprobante con ID ${dto.id_comprobante} no encontrado.`,
      );
    }
    dto.detalles.forEach((detail) => {
      const itemInReceipt = receipt.items.find(
        (item) => Number(item.productId) === detail.id_prod_ref,
      );
      if (!itemInReceipt) {
        throw new Error(
          `El producto con ID ${detail.id_prod_ref} no existe en el comprobante ${dto.id_comprobante}.`,
        );
      }
      if (detail.cantidad > itemInReceipt.quantity) {
        throw new Error(
          `La cantidad solicitada (${detail.cantidad}) para el producto con ID ${detail.id_prod_ref} excede la cantidad en el comprobante (${itemInReceipt.quantity}).`,
        );
      }
    });
    const warranty = WarrantyMapper.fromRegisterDto(dto);
    warranty.addTracking({
      id_estado: 1,
      comentario: 'Registro inicial de garantía',
      id_usuario_ref: 'SISTEMA',
      fec_registro: new Date(),
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
      throw new Error(`Garantía con ID ${id} no encontrada.`);
    }
    if (dto.observaciones) warranty.updateObservaciones(dto.observaciones);
    if (dto.fec_fin) warranty.extendWarranty(new Date(dto.fec_fin));
    const updatedWarranty = await this.repository.update(warranty);
    return WarrantyMapper.toResponseDto(updatedWarranty);
  }
  async changeStatus(
    id: number,
    idEstado: number,
    comentario: string,
    idUsuario: string,
  ): Promise<WarrantyResponseDto> {
    const warranty = await this.repository.findById(id);
    if (!warranty) {
      throw new Error(`Garantía con ID ${id} no encontrada.`);
    }
    if (warranty.id_estado === 3 && idEstado === 2) {
      throw new BadRequestException(
        'No se puede aprobar una garantía que ya fue rechazada.',
      );
    }
    warranty.changeStatus(idEstado);
    warranty.addTracking({
      id_estado: idEstado,
      comentario,
      id_usuario_ref: idUsuario,
      fec_registro: new Date(),
    });
    const updatedWarranty = await this.repository.update(warranty);
    return WarrantyMapper.toResponseDto(updatedWarranty);
  }
  async deleteWarranty(id: number): Promise<WarrantyDeleteResponseDto> {
    const warranty = await this.repository.findById(id);
    if (!warranty) {
      throw new Error(`Garantía con ID ${id} no encontrada.`);
    }
    await this.repository.delete(id);
    return {
      id_garantia: id,
      message: 'Garantía eliminada correctamente',
      deletedAt: new Date(),
    };
  }
}
