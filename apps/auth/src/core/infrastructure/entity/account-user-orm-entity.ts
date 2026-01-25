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
import { BitToBooleanTransformer } from 'libs/common/src/infrastructure/transformers/bit-to-boolean.transformer';

@Entity({ name: 'cuenta_usuario', schema: 'mkp_administracion' })
export class AccountUserOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_cuenta' })
  id_cuenta: number;

  @OneToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserOrmEntity;

  @Column({ name: 'id_usuario' })
  id_usuario_val: number;

  @Column({ name: 'id_sede' })
  id_sede: number;

  @Column({ name: 'nom_usu', length: 50 })
  nom_usu: string;

  @Column({ name: 'contraseña', length: 255 })
  contraseña: string;

  @Column({ name: 'email_emp', length: 150 })
  email_emp: string;

  @Column({
    name: 'activo',
    type: 'bit',
    width: 1,
    transformer: BitToBooleanTransformer,
    default: () => "b'1'",
  })
  activo: boolean;
  @Column({ name: 'ultimo_acceso', type: 'datetime' })
  ultimo_acceso: Date;

  @ManyToMany(() => RoleOrmEntity)
  @JoinTable({
    name: 'cuenta_rol',
    joinColumn: { name: 'id_cuenta', referencedColumnName: 'id_cuenta' },
    inverseJoinColumn: { name: 'id_rol', referencedColumnName: 'id_rol' },
  })
  roles: RoleOrmEntity[];
}
export { UserOrmEntity };
