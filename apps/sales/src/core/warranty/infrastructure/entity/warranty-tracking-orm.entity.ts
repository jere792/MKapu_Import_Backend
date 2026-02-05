import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WarrantyOrmEntity } from './warranty-orm-entity';

@Entity({ name: 'seguimiento_garantia' })
export class WarrantyTrackingOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_seguimiento', type: 'int' })
  id_seguimiento: number;

  @ManyToOne(() => WarrantyOrmEntity, (warranty) => warranty.tracking)
  @JoinColumn({ name: 'id_garantia' })
  warranty: WarrantyOrmEntity;

  @Column({ name: 'id_usuario_ref', type: 'varchar', length: 50 })
  id_usuario_ref: string;

  @Column({
    name: 'fecha',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha: Date;

  // Guardamos el ID o la descripción del estado (según prefieras, aquí asumo ID por normalización)
  @Column({ name: 'estado_anterior', type: 'int', nullable: true })
  estado_anterior: number;

  @Column({ name: 'estado_nuevo', type: 'int' })
  estado_nuevo: number;

  @Column({ name: 'observación', type: 'text', nullable: true })
  observacion: string;
}
