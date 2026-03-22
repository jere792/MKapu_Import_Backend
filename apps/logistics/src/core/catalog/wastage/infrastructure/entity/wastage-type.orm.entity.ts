import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WastageOrmEntity } from './wastage-orm.entity';

export enum TipoMermaEnum {
  DAÑO         = 'DAÑO',
  VENCIMIENTO  = 'VENCIMIENTO',
  ROBO         = 'ROBO',
  DETERIORO    = 'DETERIORO',
  ERROR_CONTEO = 'ERROR_CONTEO',
  DEVOLUCION   = 'DEVOLUCION',
  OTRO         = 'OTRO',
}

@Entity('tipo_merma')
export class WastageTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo' })
  id_tipo!: number;

  @Column({
    type: 'enum',
    enum: TipoMermaEnum,
    default: TipoMermaEnum.OTRO,
  })
  tipo!: TipoMermaEnum;

  @Column({ name: 'motivo_merma', type: 'varchar', length: 150 })
  motivo_merma!: string;

  @Column({ type: 'bit', width: 1, default: () => "b'1'" })
  estado!: boolean;

  @OneToMany(() => WastageOrmEntity, w => w.tipoMerma)
  mermas?: WastageOrmEntity[];
}