import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductOrmEntity } from '../../../product/infrastructure/entity/product-orm.entity';
import { StoreOrmEntity } from '../../../../warehouse/store/infrastructure/entity/store-orm.entity';
@Entity({ name: 'unidad' })
export class UnitOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_unidad', type: 'int' })
  id_unidad: number;

  @Column({ name: 'id_producto', type: 'int' })
  id_producto: number;

  @Column({ name: 'id_almacen', type: 'int' })
  id_almacen: number;

  @Column({ name: 'serie', type: 'varchar', length: 50 })
  serie: string;

  @Column({ name: 'fec_venc', type: 'date' })
  fec_venc: Date;

  @Column({ name: 'estado', type: 'varchar', length: 50 })
  estado: string;
  @ManyToOne(() => ProductOrmEntity)
  @JoinColumn({ name: 'id_producto' })
  producto: ProductOrmEntity;

  @ManyToOne(() => StoreOrmEntity)
  @JoinColumn({ name: 'id_almacen' })
  almacen: StoreOrmEntity;
}
