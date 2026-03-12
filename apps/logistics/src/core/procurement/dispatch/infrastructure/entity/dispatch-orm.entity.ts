import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DispatchStatus } from '../../domain/entity/dispatch-domain-entity';
import { DispatchDetailOrmEntity } from './dispatch-detail-orm.entity';

@Entity('despacho')
export class DispatchOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_despacho', type: 'int' })
  id_despacho: number;

  @Column({ name: 'id_venta_ref', type: 'int' })
  id_venta_ref: number;

  @Column({ name: 'id_usuario_ref', type: 'varchar', length: 255 })
  id_usuario_ref: string;

  @Column({ name: 'id_almacen_origen', type: 'int' })
  id_almacen_origen: number;

  @Column({
    name: 'fecha_creacion',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_creacion: Date;

  @Column({ name: 'fecha_programada', type: 'datetime', nullable: true })
  fecha_programada: Date | null;

  @Column({ name: 'fecha_salida', type: 'datetime', nullable: true })
  fecha_salida: Date | null;

  @Column({ name: 'fecha_entrega', type: 'datetime', nullable: true })
  fecha_entrega: Date | null;

  @Column({ name: 'direccion_entrega', type: 'varchar', length: 200 })
  direccion_entrega: string;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observacion: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: DispatchStatus,
    default: DispatchStatus.GENERADO,
  })
  estado: DispatchStatus;

  @OneToMany(() => DispatchDetailOrmEntity, (detail) => detail.despacho, {
    cascade: true,
  })
  detalles: DispatchDetailOrmEntity[];
}
