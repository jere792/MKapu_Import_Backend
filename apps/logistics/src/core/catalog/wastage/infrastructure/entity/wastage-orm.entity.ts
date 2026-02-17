import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { WastageDetailOrmEntity } from './wastage-detail.orm.entity';
import { WastageTypeOrmEntity } from './wastage-type.orm.entity';


// wastage-orm.entity.ts

@Entity('merma')
export class WastageOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_merma' })
  id_merma!: number;

  @Column({ name: 'id_usuario_ref' })
  id_usuario_ref!: number;

  @Column({ name: 'id_sede_ref' })
  id_sede_ref!: number;

  @CreateDateColumn({ 
    name: 'fec_merma',
    type: 'datetime', 
    precision: 6, 
    default: () => 'CURRENT_TIMESTAMP(6)' 
  })
  fec_merma!: Date;

  @Column({ type: 'varchar', length: 255 })
  motivo!: string;

  @Column({ 
    type: 'bit', 
    width: 1, 
    default: () => "b'1'",
    transformer: { to: (v: boolean) => v, from: (v: any) => (v ? !!v[0] : false) }
  })
  estado!: boolean;

  @Column({ name: 'id_almacen_ref' })
  id_almacen_ref!: number;

  @Column({ name: 'id_tipo_merma', type: 'int' })
  id_tipo_merma!: number;

  @ManyToOne(() => WastageTypeOrmEntity, (t) => t.mermas, { 
    eager: false,
    createForeignKeyConstraints: false
  })
  @JoinColumn({ name: 'id_tipo_merma' })
  tipoMerma?: WastageTypeOrmEntity;

  @OneToMany(() => WastageDetailOrmEntity, (detail) => detail.merma, { cascade: true })
  detalles!: WastageDetailOrmEntity[];
}