/* ============================================
   administration/src/core/role-permission/infrastructure/entity/role-permission-orm.entity.ts
   ============================================ */

import { Entity, Index, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'rol_permiso' })


export class RolePermissionOrmEntity {
  @PrimaryColumn({ name: 'id_rol', type: 'int' })
  id_rol: number;

  @PrimaryColumn({ name: 'id_permiso', type: 'int' })
  id_permiso: number;
}