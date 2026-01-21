/* auth/src/core/infrastructure/entity/account-user-orm-entity.ts */
import {
  Entity,
  Column,
  JoinColumn,
  OneToOne,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from './user-orm-entity';
import { RoleOrmEntity } from './role-orm-entity';

@Entity('cuenta_usuario')
export class AccountUserOrmEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id_cuenta' })
  id_cuenta_usuario: string;

  @Column({ name: 'username', type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'activo', type: 'tinyint', default: 1 })
  activo: number;

  @Column({ name: 'ultimo_acceso', type: 'datetime', nullable: true })
  ultimo_acceso: Date;

  @OneToOne(() => UserOrmEntity, (user) => user.cuenta)
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserOrmEntity;

  @ManyToMany(() => RoleOrmEntity, (role) => role.cuentas)
  @JoinTable({
    name: 'cuenta_usuario_roles', // Nombre de la tabla intermedia
    joinColumn: {
      name: 'id_cuenta_usuario',
      referencedColumnName: 'id_cuenta_usuario',
    },
    inverseJoinColumn: { name: 'id_rol', referencedColumnName: 'id' },
  })
  roles: RoleOrmEntity[];
}
export { UserOrmEntity };
