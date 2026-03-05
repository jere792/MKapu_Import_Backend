import {
  Transfer,
  TransferItem,
  TransferMode,
  TransferStatus,
} from '../../domain/entity/transfer-domain-entity';
import { TransferOrmEntity } from '../../infrastructure/entity/transfer-orm.entity';

export class TransferMapper {
  static mapToDomain(
    entity: TransferOrmEntity,
    originHq: string,
    destHq: string,
  ): Transfer {
    const transferMode =
      entity.operationType === 'TRANSFERENCIA_AGGREGATED'
        ? TransferMode.AGGREGATED
        : TransferMode.SERIALIZED;

    const itemsMap = new Map<number, string[]>();
    const quantityMap = new Map<number, number>();
    if (entity.details) {
      entity.details.forEach((d) => {
        if (transferMode === TransferMode.AGGREGATED) {
          quantityMap.set(
            d.productId,
            (quantityMap.get(d.productId) ?? 0) + Number(d.quantity ?? 1),
          );
          return;
        }
        const existing = itemsMap.get(d.productId) || [];
        existing.push(d.serialNumber);
        itemsMap.set(d.productId, existing);
      });
    }

    const items: TransferItem[] = [];
    if (transferMode === TransferMode.AGGREGATED) {
      quantityMap.forEach((quantity, productId) => {
        items.push(TransferItem.fromQuantity(productId, quantity));
      });
    } else {
      itemsMap.forEach((series, productId) => {
        items.push(new TransferItem(productId, series));
      });
    }

    return new Transfer(
      originHq,
      entity.originWarehouseId,
      destHq,
      entity.destinationWarehouseId,
      items,
      entity.motive,
      entity.id,
      entity.userIdRefOrigin ?? undefined,
      entity.status as TransferStatus,
      entity.date,
      undefined,
      undefined,
      entity.userIdRefDest ?? undefined,
      transferMode,
    );
  }
}
