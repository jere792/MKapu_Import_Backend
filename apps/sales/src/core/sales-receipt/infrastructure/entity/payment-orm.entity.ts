/* apps/sales/src/core/sales-receipt/infrastructure/entity/payment-orm.entity.ts */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentTypeOrmEntity } from './payment-type-orm.entity';

@Entity('pago')
export class PaymentOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id: number;

  @Column({ name: 'id_comprobante' })
  id_comprobante: number;

  @Column({ name: 'id_tipo_pago' })
  id_tipo_pago: number;

  @ManyToOne(() => PaymentTypeOrmEntity)
  @JoinColumn({ name: 'id_tipo_pago' })
  paymentType: PaymentTypeOrmEntity;

  @Column({ name: 'monto', type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @CreateDateColumn({ name: 'fec_pago' })
  fec_pago: Date;
}
