/* auth/src/core/infrastructure/entity/role-orm-entity.ts */

import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountUserOrmEntity } from './account-user-orm-entity';
import { PermissionOrmEntity } from './permission-orm-entity';

@Entity({ name: 'rol', schema: 'mkp_administracion', synchronize: false })
export class RoleOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @Column({ name: 'nombre', length: 45 })
  nombre: string;

  @ManyToMany(() => AccountUserOrmEntity)
  @JoinTable({
    name: 'cuenta_rol',
    joinColumn: { name: 'id_rol', referencedColumnName: 'id_rol' },
    inverseJoinColumn: { name: 'id_cuenta', referencedColumnName: 'id_cuenta' },
  })
  accounts: AccountUserOrmEntity[];

  @Column({ name: 'descripcion', type: 'varchar', length: 50 })
  descripcion: string;

  @ManyToMany(() => PermissionOrmEntity)
  @JoinTable({
    name: 'rol_permiso',
    joinColumn: {
      name: 'id_rol',
      referencedColumnName: 'id_rol',
    },
    inverseJoinColumn: {
      name: 'id_permiso',
      referencedColumnName: 'id_permiso',
    },
  })
  permisos: PermissionOrmEntity[];
}
