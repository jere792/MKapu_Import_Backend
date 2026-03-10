import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('regla_promocion')
export class ReglaPromocionOrmEntity {
  @PrimaryGeneratedColumn()
  id_regla: number;

  @Column()
  id_promocion: number;

  @Column({ type: 'varchar', length: 100 })
  tipo_condicion: string;

  @Column({ type: 'varchar', length: 100 })
  valor_condicion: string;
}
