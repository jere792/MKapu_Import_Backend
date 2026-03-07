import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'permiso' })
export class PermissionOrmEntity {
  @PrimaryColumn({ name: 'id_permiso', type: 'int' })
  id_permiso: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 50 })
  descripcion: string;
}
