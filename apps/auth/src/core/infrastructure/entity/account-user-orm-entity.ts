/* auth/src/core/infrastructure/entity/account-user-orm-entity.ts */
import {
  Entity,
  Column,
  PrimaryColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { UserOrmEntity } from './user-orm-entity';
import { RoleOrmEntity } from './role-orm-entity';
import { HeadQuartersOrmEntity } from './headquarters-orm-entity';

@Entity('cuenta_usuario')
export class AccountUserOrmEntity {
  @PrimaryColumn({ name: 'id_cuenta' })
  id: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ name: 'email_emp' })
  email: string;

  @Column()
  estado: string;

  @Column()
  rol_id: number;

  @Column({ type: 'datetime', nullable: true })
  ultimo_acceso: Date;

  @OneToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserOrmEntity;

  @ManyToOne(() => HeadQuartersOrmEntity)
  @JoinColumn({ name: 'id_sede' })
  sede: HeadQuartersOrmEntity;

  @ManyToOne(() => RoleOrmEntity)
  @JoinColumn({ name: 'rol_id' })
  roles: RoleOrmEntity[];
}
export { UserOrmEntity };
