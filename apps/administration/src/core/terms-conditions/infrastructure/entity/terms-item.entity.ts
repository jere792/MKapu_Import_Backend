// infrastructure/entity/terminos-item.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { TerminosSeccionEntity } from './terms-section.entity';

@Entity('terminos_items')
export class TerminosItemEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TerminosSeccionEntity, (s) => s.items, {
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