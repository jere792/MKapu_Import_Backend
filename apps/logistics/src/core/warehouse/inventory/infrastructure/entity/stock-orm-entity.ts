import { WarehouseOrmEntity } from '../../../infrastructure/entity/warehouse-orm.entity';
import { ProductOrmEntity } from 'apps/logistics/src/core/catalog/product/infrastructure/entity/product-orm.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'stock' })
export class StockOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_stock' })
  id_stock: number;

  @Column({ name: 'id_producto' })
  id_producto: number;

  @Column({ name: 'id_almacen' })
  id_almacen: number;

  @ManyToOne(() => WarehouseOrmEntity)
  @JoinColumn({ name: 'id_almacen' })
  almacen: WarehouseOrmEntity;

  @ManyToOne(() => ProductOrmEntity)
  @JoinColumn({ name: 'id_producto' })
  producto: ProductOrmEntity;

  @Column({ name: 'id_sede', length: 50 })
  id_sede: string;

  @Column({ name: 'tipo_ubicacion', length: 50 })
  tipo_ubicacion: string;

  @Column({ name: 'cantidad' })
  cantidad: number;

  @Column({ name: 'estado', length: 50 })
  estado: string;
}
