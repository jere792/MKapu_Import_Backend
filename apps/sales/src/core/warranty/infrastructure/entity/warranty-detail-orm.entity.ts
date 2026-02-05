import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WarrantyOrmEntity } from './warranty-orm-entity';

@Entity({ name: 'detalle_garantia' })
export class WarrantyDetailOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle', type: 'int' })
  id_detalle: number;

  @ManyToOne(() => WarrantyOrmEntity, (warranty) => warranty.details)
  @JoinColumn({ name: 'id_garantia' })
  warranty: WarrantyOrmEntity;

  @Column({ name: 'tipo_solicitud', type: 'varchar', length: 50 })
  tipo_solicitud: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;
}
