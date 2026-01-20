/* auth/src/core/infrastructure/entity/role-orm-entity.ts */

import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccountUserOrmEntity } from './account-user-orm-entity';

@Entity('roles')
export class RoleOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;
  @ManyToMany(() => AccountUserOrmEntity, (account) => account.roles)
  cuentas: AccountUserOrmEntity[];
}
