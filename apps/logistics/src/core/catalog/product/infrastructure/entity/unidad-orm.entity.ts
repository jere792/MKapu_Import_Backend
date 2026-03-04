import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductOrmEntity } from './product-orm.entity';
import { WarehouseOrmEntity } from 'apps/logistics/src/core/warehouse/infrastructure/entity/warehouse-orm.entity';

@Entity({ name: 'unidad'})
export class UnidadOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_unidad', type: 'int' })
  id_unidad: number;

  @ManyToOne(() => ProductOrmEntity, { eager: false })
  @JoinColumn({ name: 'id_producto' })
  producto: ProductOrmEntity;

  @ManyToOne(() => WarehouseOrmEntity, { eager: false })
  @JoinColumn({ name: 'id_almacen' })
  almacen: WarehouseOrmEntity;

  @Column({ name: 'serie', type: 'varchar', length: 50 })
  serie: string;

  @Column({ name: 'fec_venc', type: 'date' })
  fec_venc: Date;

  @Column({ name: 'estado', type: 'varchar', length: 50 })
  estado: string;
}