// infrastructure/entity/terminos-parrafo.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { TerminosSeccionEntity } from './terms-section.entity';

@Entity('terminos_parrafos')
export class TerminosParrafoEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TerminosSeccionEntity, (s) => s.parrafos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'seccion_id' })
  seccion: TerminosSeccionEntity;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ type: 'int' })
  orden: number;
}