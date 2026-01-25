import { Stock } from '../../domain/entity/stock-domain-intity';
import { StockOrmEntity } from '../../infrastructure/entity/stock-domain-intity';

export class StockMapper {
  static toDomain(orm: StockOrmEntity): Stock {
    return new Stock(
      orm.id_stock,
      orm.id_producto,
      orm.id_almacen,
      orm.id_sede,
      orm.cantidad,
      orm.tipo_ubicacion,
      orm.estado,
    );
  }

  static toOrm(domain: Stock): StockOrmEntity {
    const orm = new StockOrmEntity();
    if (domain.id) orm.id_stock = domain.id;

    orm.id_producto = domain.productId;
    orm.id_almacen = domain.warehouseId;
    orm.id_sede = domain.headquartersId;
    orm.cantidad = domain.quantity;
    orm.tipo_ubicacion = domain.locationType;
    orm.estado = domain.status;

    return orm;
  }
}
