// infrastructure/entity/terminos-seccion.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { TerminosCondicionesEntity } from './terms-conditions.entity';
import { TerminosItemEntity } from './terms-item.entity';
import { TerminosParrafoEntity } from './terms-paragraph.entity';


@Entity('terminos_secciones')
export class TerminosSeccionEntity {

  @PrimaryGeneratedColumn()
  id: number;

    @ManyToOne(() => TerminosCondicionesEntity, (t) => t.secciones, {
    nullable: false,
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete', 
    })
    @JoinColumn({ name: 'termino_id' })
    termino: TerminosCondicionesEntity;

  @Column({ type: 'varchar', length: 5 })
  numero: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'int' })
  orden: number;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @OneToMany(() => TerminosParrafoEntity, (p) => p.seccion, {
    cascade: true,
  })
  parrafos: TerminosParrafoEntity[];

  @OneToMany(() => TerminosItemEntity, (i) => i.seccion, {
    cascade: true,
  })
  items: TerminosItemEntity[];
}