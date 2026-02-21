import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InventoryMovementDetailOrmEntity } from './inventory-movement-detail-orm.entity';

@Entity({ name: 'movimiento_inventario', schema: 'mkp_logistica' })
export class InventoryMovementOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id: number;

  @Column({
    name: 'tipo_origen',
    type: 'enum',
    enum: ['TRANSFERENCIA', 'COMPRA', 'VENTA', 'AJUSTE'],
    default: 'TRANSFERENCIA',
  })
  originType: string;

  @Column({ name: 'ref_id' })
  refId: number;

  @Column({ name: 'ref_tabla', length: 50 })
  refTable: string;

  @CreateDateColumn({ name: 'fecha' })
  date: Date;

  @Column({ name: 'observacion', length: 255, nullable: true })
  observation: string;

  @OneToMany(
    () => InventoryMovementDetailOrmEntity,
    (detail) => detail.movement,
    { cascade: true },
  )
  details: InventoryMovementDetailOrmEntity[];
}
