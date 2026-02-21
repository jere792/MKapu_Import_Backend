import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoryOrmEntity } from './category-orm.entity';
import { BitToBooleanTransformer } from 'libs/common/src';

@Entity({ name: 'producto', schema: 'mkp_logistica' })
export class ProductOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_producto', type: 'int' })
  id_producto: number;

  @ManyToOne(() => CategoryOrmEntity, { eager: true })
  @JoinColumn({ name: 'id_categoria' })
  categoria: CategoryOrmEntity;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ name: 'anexo', type: 'varchar', length: 50 })
  anexo: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 150 })
  descripcion: string;

  @Column({ name: 'pre_compra', type: 'decimal', precision: 10, scale: 2 })
  pre_compra: number;

  @Column({ name: 'pre_venta', type: 'decimal', precision: 10, scale: 2 })
  pre_venta: number;

  @Column({ name: 'pre_unit', type: 'decimal', precision: 10, scale: 2 })
  pre_unit: number;

  @Column({ name: 'pre_may', type: 'decimal', precision: 10, scale: 2 })
  pre_may: number;

  @Column({ name: 'pre_caja', type: 'decimal', precision: 10, scale: 2 })
  pre_caja: number;

  @Column({ name: 'uni_med', type: 'varchar', length: 45 })
  uni_med: string;

  @Column({
    name: 'estado',
    type: 'bit',
    width: 1,
    transformer: BitToBooleanTransformer,
    default: () => "b'1'",
  })
  estado: boolean;

  @Column({ name: 'fec_creacion', type: 'date' })
  fec_creacion: Date;

  @Column({ name: 'fec_actual', type: 'date' })
  fec_actual: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    name: 'peso_unitario',
    default: 1.0,
  })
  peso_unitario: number;
}
