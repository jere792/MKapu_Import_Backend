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

@Entity('commission')
export class CommissionOrmEntity {
  @PrimaryGeneratedColumn()
  id_comision: number;

  @Column({ name: 'id_vendedor_ref', type: 'varchar', length: 50 })
  id_vendedor_ref: string;

  @Column({ name: 'id_comprobante', type: 'int' })
  id_comprobante: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: 'Porcentaje aplicado',
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

  @ManyToOne(() => CommissionRuleOrmEntity, (rule) => rule.comisiones)
  @JoinColumn({ name: 'id_regla' })
  regla: CommissionRuleOrmEntity;
}
