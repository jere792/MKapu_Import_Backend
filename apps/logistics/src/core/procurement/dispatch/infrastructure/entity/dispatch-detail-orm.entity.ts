import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DispatchDetailStatus } from '../../domain/entity/dispatch-detail-domain-entity';
import { DispatchOrmEntity } from './dispatch-orm.entity';

@Entity('detalle_despacho')
export class DispatchDetailOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle_despacho', type: 'int' })
  id_detalle_despacho: number;

  @Column({ name: 'id_despacho', type: 'int' })
  id_despacho: number;

  @Column({ name: 'id_producto', type: 'int' })
  id_producto: number;

  @Column({ name: 'cantidad_solicitada', type: 'int' })
  cantidad_solicitada: number;

  @Column({ name: 'cantidad_despachada', type: 'int' })
  cantidad_despachada: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: DispatchDetailStatus,
    default: DispatchDetailStatus.PENDIENTE,
  })
  estado: DispatchDetailStatus;

  @ManyToOne(() => DispatchOrmEntity, despacho => despacho.detalles)
  @JoinColumn({ name: 'id_despacho' })
  despacho: DispatchOrmEntity;
}