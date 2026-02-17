import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AuctionDetailOrmEntity } from './auction-detail.orm.entity';

@Entity('remate')
export class AuctionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_remate' })
  id_remate!: number;

  @Column({ name: 'cod_remate', type: 'varchar', length: 20 })
  cod_remate!: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 150 })
  descripcion!: string;

  @CreateDateColumn({
    name: 'fec_inicio',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fec_inicio!: Date;

  @Column({ name: 'fec_fin', type: 'datetime' })
  fec_fin!: Date;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['ACTIVO', 'FINALIZADO'],
    default: 'ACTIVO',
  })
  estado!: 'ACTIVO' | 'FINALIZADO';

  @OneToMany(() => AuctionDetailOrmEntity, (d) => d.remate, {
    cascade: true,
    eager: false,
  })
  detalles!: AuctionDetailOrmEntity[];
}