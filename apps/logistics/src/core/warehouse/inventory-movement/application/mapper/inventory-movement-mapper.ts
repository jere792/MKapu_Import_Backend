/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  InventoryDetail,
  InventoryMovement,
} from '../../domain/entity/inventory-movement.entity';
import { InventoryMovementDetailOrmEntity } from '../../infrastructure/entity/inventory-movement-detail-orm.entity';
import { InventoryMovementOrmEntity } from '../../infrastructure/entity/inventory-movement-orm.entity';

export class InventoryMovementMapper {
  static toDomain(ormEntity: InventoryMovementOrmEntity): InventoryMovement {
    const items =
      ormEntity.detalles?.map(
        (d) =>
          new InventoryDetail(
            d.id_producto,
            d.id_almacen,
            d.cantidad,
            d.tipo as any,
          ),
      ) || [];

    return new InventoryMovement({
      id: ormEntity.id_movimiento,
      originType: ormEntity.tipo_origen as any,
      refId: ormEntity.ref_id,
      refTable: ormEntity.ref_tabla,
      observation: ormEntity.observacion,
      date: ormEntity.fecha,
      items: items,
    });
  }

  static toOrm(domainEntity: InventoryMovement): InventoryMovementOrmEntity {
    const orm = new InventoryMovementOrmEntity();

    if (domainEntity.id) orm.id_movimiento = domainEntity.id;

    orm.tipo_origen = domainEntity.originType;
    orm.ref_id = domainEntity.refId;
    orm.ref_tabla = domainEntity.refTable;
    orm.observacion = domainEntity.observation;
    orm.fecha = domainEntity.date || new Date();

    orm.detalles = domainEntity.items.map((item) => {
      const detailOrm = new InventoryMovementDetailOrmEntity();
      detailOrm.id_producto = item.productId;
      detailOrm.id_almacen = item.warehouseId;
      detailOrm.cantidad = item.quantity;
      detailOrm.tipo = item.type;
      return detailOrm;
    });

    return orm;
  }
}
