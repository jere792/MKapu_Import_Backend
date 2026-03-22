import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipo_servicio')
export class ServiceTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_servicio' })
  id_servicio: number;

  @Column({ name: 'id_banco', type: 'int' })
  id_banco: number;

  @Column({ name: 'nombre_servicio', type: 'varchar', length: 100 })
  nombre_servicio: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 150, nullable: true })
  descripcion: string;
}