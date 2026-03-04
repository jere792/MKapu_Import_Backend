import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClaimStatus } from '../../domain/entity/claim-detail-domain-entity';
import { ClaimDetailOrmEntity } from './claim-detail-orm.entity';
@Entity({ name: 'reclamo' })
export class ClaimOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_reclamo' })
  id_reclamo: number;

  @Column({ name: 'id_comprobante' })
  id_comprobante: number;

  @Column({ name: 'id_usuario' })
  id_vendedor_ref: string;

  @Column({ name: 'codigo_reclamo', unique: true, nullable: true })
  codigo_reclamo: string;

  @Column()
  motivo: string;

  @Column('text')
  descripcion: string;

  @Column({ name: 'respuesta', type: 'text', nullable: true })
  respuesta: string;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.REGISTRADO,
  })
  estado: ClaimStatus;

  @CreateDateColumn({ name: 'fec_creacion' })
  fecha_registro: Date;

  @Column({ name: 'fec_resolucion', nullable: true })
  fecha_resolucion: Date;

  @OneToMany(() => ClaimDetailOrmEntity, (detalle) => detalle.reclamo, {
    cascade: true,
    eager: true,
  })
  detalles: ClaimDetailOrmEntity[];
}
