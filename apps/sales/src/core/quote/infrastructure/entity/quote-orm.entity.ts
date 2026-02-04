import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomerOrmEntity } from './customer-orm.entity';

@Entity('cotizacion')
export class QuoteOrmEntity {
  @PrimaryGeneratedColumn()
  id_cotizacion: number;

  @Column({ length: 255 })
  id_cliente: string;

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

  @Column({ type: 'enum', enum: ['PENDIENTE', 'APROBADA', 'VENCIDA'], default: 'PENDIENTE' })
  estado: string;

  @Column({ type: 'bit', transformer: { to: (v) => v, from: (v) => !!v[0] } })
  activo: boolean;

  // Relación: Muchas cotizaciones pertenecen a un cliente
  @ManyToOne(() => CustomerOrmEntity, (customer) => customer.quotes)
  @JoinColumn({ name: 'id_cliente' })
  customer: CustomerOrmEntity;
}