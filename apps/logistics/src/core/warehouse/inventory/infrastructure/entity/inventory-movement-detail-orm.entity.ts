import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InventoryMovementOrmEntity } from './inventory-movement-orm.entity';

@Entity({ name: 'detalle_movimiento_inventario', schema: 'mkp_logistica' })
export class InventoryMovementDetailOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle_inv' })
  id: number;

  @Column({ name: 'id_movimiento' })
  movementId: number;

  @Column({ name: 'id_producto' })
  productId: number;

  @Column({ name: 'id_almacen' })
  warehouseId: number;

  @Column({ name: 'cantidad' })
  quantity: number;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['INGRESO', 'SALIDA'],
  })
  type: string;

  @ManyToOne(() => InventoryMovementOrmEntity, (m) => m.details)
  @JoinColumn({ name: 'id_movimiento' })
  movement: InventoryMovementOrmEntity;
}
