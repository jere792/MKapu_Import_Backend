/* ============================================
   administration/src/core/permission/infrastructure/entity/permission-orm.entity.ts
   ============================================ */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'permiso', schema: 'mkp_administracion' })
export class PermissionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_permiso', type: 'int' })
  id_permiso: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 50 })
  descripcion: string;

  @Column({ name: 'activo', type: 'tinyint', width: 1, default: 1 })
  activo: boolean;
}
