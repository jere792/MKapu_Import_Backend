// infrastructure/entity/terminos-condiciones.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { TerminosSeccionEntity } from './terms-section.entity';
import { CuentaUsuarioOrmEntity } from '../../../user/infrastructure/entity/cuenta-usuario-orm.entity';

@Entity('terminos_condiciones')
export class TerminosCondicionesEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })  
  version: string;

  @Column({ name: 'fecha_vigencia', type: 'date' })
  fechaVigencia: Date;

  @Column({ type: 'boolean', default: false })
  activo: boolean;

  @ManyToOne(() => CuentaUsuarioOrmEntity, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creadoPor: CuentaUsuarioOrmEntity;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

    @OneToMany(() => TerminosSeccionEntity, (s) => s.termino, {
    cascade: true,
    orphanedRowAction: 'delete', 
    })
    secciones: TerminosSeccionEntity[];
}