/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  @PrimaryGeneratedColumn({ name: 'id_detalle_inv', type: 'int' })
  id_detalle_inv: number;

  // Relación con la Cabecera
  @ManyToOne(() => InventoryMovementOrmEntity, (movement) => movement.detalles)
  @JoinColumn({ name: 'id_movimiento' })
  movimiento: InventoryMovementOrmEntity;

  @Column({ name: 'id_producto', type: 'int' })
  id_producto: number;

  @Column({ name: 'id_almacen', type: 'int' })
  id_almacen: number;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad: number;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['INGRESO', 'SALIDA'],
  })
  tipo: string;
}
