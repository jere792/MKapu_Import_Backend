import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuctionOrmEntity } from './auction-orm.entity';

@Entity('detalle_remate')
export class AuctionDetailOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle_remate' })
  id_detalle_remate!: number;

  @Column('decimal', { name: 'pre_original', precision: 10, scale: 2 })
  pre_original!: number;

  @Column('decimal', { name: 'pre_remate', precision: 10, scale: 2 })
  pre_remate!: number;

  @Column({ name: 'stock_remate', type: 'int' })
  stock_remate!: number;

  @Column({ name: 'id_remate', type: 'int' })
  id_remate!: number;

  @Column({ name: 'id_producto', type: 'int' })
  id_producto!: number;

  @ManyToOne(() => AuctionOrmEntity, (a) => a.detalles, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false, 
  })
  @JoinColumn({ name: 'id_remate' })
  remate?: AuctionOrmEntity;
}