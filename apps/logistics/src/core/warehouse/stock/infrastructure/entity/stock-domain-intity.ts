import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StoreOrmEntity } from '../../../store/infrastructure/entity/store-orm.entity';
import { ProductOrmEntity } from 'apps/logistics/src/core/catalog/product/infrastructure/entity/product-orm.entity';

@Entity({ name: 'stock', schema: 'mkp_logistica' })
export class StockOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_stock', type: 'int' })
  id_stock: number;

  @Column({ name: 'id_producto', type: 'int', nullable: false })
  id_producto: number;

  @Column({ name: 'id_almacen', type: 'int', nullable: false })
  id_almacen: number;

  @Column({ name: 'id_sede', type: 'varchar', length: 50, nullable: false })
  id_sede: string;

  @Column({
    name: 'tipo_ubicacion',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  tipo_ubicacion: string;

  @Column({ name: 'cantidad', type: 'int', nullable: false })
  cantidad: number;

  @Column({ name: 'estado', type: 'varchar', length: 50, nullable: false })
  estado: string;

  @ManyToOne(() => ProductOrmEntity)
  @JoinColumn({ name: 'id_producto' })
  producto: ProductOrmEntity;

  @ManyToOne(() => StoreOrmEntity)
  @JoinColumn({ name: 'id_almacen' })
  almacen: StoreOrmEntity;
}
