import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import {
  CommissionTargetType,
  CommissionRewardType,
} from '../../domain/entity/commission-rule.entity';
import { CommissionOrmEntity } from './commission-orm.entity';

@Entity('commission_rules')
export class CommissionRuleOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_regla' })
  id_regla: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @Column({
    name: 'tipo_objetivo',
    type: 'enum',
    enum: CommissionTargetType,
  })
  tipo_objetivo: CommissionTargetType;

  @Column({
    name: 'id_objetivo',
    type: 'int',
    comment: 'ID del Producto o Categoría',
  })
  id_objetivo: number;

  @Column({ name: 'meta_unidades', type: 'int', default: 1 })
  meta_unidades: number;

  @Column({
    name: 'tipo_recompensa',
    type: 'enum',
    enum: CommissionRewardType,
  })
  tipo_recompensa: CommissionRewardType;

  @Column({
    name: 'valor_recompensa',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  valor_recompensa: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'fecha_inicio', type: 'timestamp' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fecha_fin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CommissionOrmEntity, (commission) => commission.regla)
  comisiones: CommissionOrmEntity[];
}
