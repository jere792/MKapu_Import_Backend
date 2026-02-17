import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WastageOrmEntity } from './wastage-orm.entity';

@Entity('tipo_merma')
export class WastageTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo' })
  id_tipo!: number;

  @Column({ type: 'enum', enum: ['POR_DEFECTO','DAÑO','GARANTIA','MERMA','OFERTA'], default: 'POR_DEFECTO' })
  tipo!: string;

  @Column({ name:'motivo_merma', type: 'varchar', length: 150 })
  motivo_merma!: string;

  @Column({ type: 'bit', width: 1, default: () => "b'1'" })
  estado!: boolean;

  @OneToMany(() => WastageOrmEntity, w => w.tipoMerma)
  mermas?: WastageOrmEntity[];
}