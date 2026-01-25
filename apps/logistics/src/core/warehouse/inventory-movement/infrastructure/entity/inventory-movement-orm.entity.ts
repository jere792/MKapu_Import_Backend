/* eslint-disable prettier/prettier */
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryMovementDetailOrmEntity } from './inventory-movement-detail-orm.entity';

@Entity({ name: 'movimiento_inventario', schema: 'mkp_logistica' })
export class InventoryMovementOrmEntity {
@PrimaryGeneratedColumn({ name: 'id_movimiento', type: 'int' })
  id_movimiento: number;

  @Column({ 
    name: 'tipo_origen', 
    type: 'enum', 
    enum: ['TRANSFERENCIA', 'COMPRA', 'VENTA', 'AJUSTE'],
    default: 'TRANSFERENCIA' 
  })
  tipo_origen: string;

  @Column({ name: 'ref_id', type: 'int' })
  ref_id: number;

  @Column({ name: 'ref_tabla', type: 'varchar', length: 50 })
  ref_tabla: string;

  @CreateDateColumn({ name: 'fecha', type: 'datetime' })
  fecha: Date;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observacion: string;

  // RELACIÓN UNO A MUCHOS con el Detalle
  @OneToMany(() => InventoryMovementDetailOrmEntity, (detail) => detail.movimiento, {
    cascade: true,
  })
  detalles: InventoryMovementDetailOrmEntity[];
}