import type { TransferResponseDto } from '../dto/out/transfer-response.dto';
import { Transfer } from '../../domain/entity/transfer-domain-entity';

export class TransferResponseMapper {
  static toResponseDto(transfer: Transfer): TransferResponseDto {
    return {
      id: transfer.id,
      creatorUserId: transfer.creatorUserId,
      approveUserId: transfer.approveUserId,
      originHeadquartersId: transfer.originHeadquartersId,
      originWarehouseId: transfer.originWarehouseId,
      destinationHeadquartersId: transfer.destinationHeadquartersId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      items: transfer.items.map((item) => ({
        productId: item.productId,
        series: item.series,
        quantity: item.quantity,
      })),
      totalQuantity: transfer.totalQuantity,
      status: transfer.status,
      observation: transfer.observation,
      requestDate: transfer.requestDate,
      responseDate: transfer.responseDate,
      completionDate: transfer.completionDate,
    };
  }
}
