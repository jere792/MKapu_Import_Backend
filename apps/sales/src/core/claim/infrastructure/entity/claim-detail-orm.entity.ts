import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClaimOrmEntity } from './claim-orm.entity';

@Entity({ name: 'reclamo_detalle' })
export class ClaimDetailOrmEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id_reclamo_detalle' })
  id: number;

  @Column({ name: 'tipo', type: 'varchar', length: 100 })
  tipo: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha: Date;

  @ManyToOne(() => ClaimOrmEntity, (claim) => claim.detalles, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'id_reclamo' })
  reclamo: ClaimOrmEntity;
}
