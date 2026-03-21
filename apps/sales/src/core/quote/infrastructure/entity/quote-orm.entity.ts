import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CustomerOrmEntity } from '../../../customer/infrastructure/entity/customer-orm.entity';
import { QuoteDetailOrmEntity } from './quote-orm-detail.entity';

@Entity('cotizacion')
export class QuoteOrmEntity {
  @PrimaryGeneratedColumn()
  id_cotizacion: number;

  @Column({ length: 255, nullable: true })
  id_cliente: string | null;

  @Column({ length: 255, nullable: true })
  id_proveedor: string | null;

  @Column({ type: 'int', nullable: false })
  id_sede: number;

  @Column({
    type: 'enum',
    enum: ['VENTA', 'COMPRA'],
    default: 'VENTA',
  })
  tipo: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fec_emision: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fec_venc: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  igv: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'APROBADA', 'VENCIDA', 'RECHAZADA'],
    default: 'PENDIENTE',
  })
  estado: string;

  @Column({ type: 'bit', transformer: { to: (v) => v, from: (v) => !!v[0] } })
  activo: boolean;

  @ManyToOne(() => CustomerOrmEntity, { nullable: true })
  @JoinColumn({ name: 'id_cliente' })
  customer: CustomerOrmEntity | null;

  @OneToMany(() => QuoteDetailOrmEntity, detalle => detalle.cotizacion, { cascade: true })
  detalles: QuoteDetailOrmEntity[];
}