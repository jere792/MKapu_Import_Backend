import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'categoria', schema: 'mkp_logistica' })
export class CategoryOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_categoria', type: 'int' })
  id_categoria: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ name: 'activo', type: 'bit', width: 1 })
  activo: boolean;
}
