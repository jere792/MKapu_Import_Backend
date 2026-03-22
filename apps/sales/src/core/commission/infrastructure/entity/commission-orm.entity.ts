import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CommissionStatus } from '../../domain/entity/commission-domain-entity';
import { CommissionRuleOrmEntity } from './commission-rule-orm.entity';
import { SalesReceiptOrmEntity } from '../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';

@Entity('commission')
export class CommissionOrmEntity {
  @PrimaryGeneratedColumn()
  id_comision: number;

  /**
   * Referencia al vendedor (trabajador) que generó el movimiento.
   * Se copia desde SalesReceiptOrmEntity.id_responsable_ref al crear la comisión.
   */
  @Column({ name: 'id_vendedor_ref', type: 'varchar', length: 255 })
  id_vendedor_ref: string;

  /**
   * FK al comprobante de venta que originó esta comisión.
   * Relación explícita para poder hacer joins y calcular totales.
   */
  @Column({ name: 'id_comprobante', type: 'int' })
  id_comprobante: number;

  @ManyToOne(() => SalesReceiptOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_comprobante' })
  comprobante: SalesReceiptOrmEntity;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: 'Porcentaje aplicado según la regla vigente',
  })
  porcentaje: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Monto calculado de la comisión',
  })
  monto: number;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDIENTE,
  })
  estado: CommissionStatus;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fecha_registro: Date;

  @Column({ name: 'fecha_liquidacion', type: 'timestamp', nullable: true })
  fecha_liquidacion?: Date;

  @Column({ name: 'id_regla', type: 'int', nullable: true })
  id_regla: number;

  @ManyToOne(() => CommissionRuleOrmEntity, (rule) => rule.comisiones, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_regla' })
  regla: CommissionRuleOrmEntity;
}