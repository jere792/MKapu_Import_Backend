/* auth/src/core/infrastructure/entity/user-orm-entity.ts */
import { Column, Entity, OneToOne } from 'typeorm';
import { AccountUserOrmEntity } from './account-user-orm-entity';

@Entity('usuario', { synchronize: false })
export class UserOrmEntity {
  @Column({ name: 'id_usuario', primary: true })
  id_usuario: number;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'usu_nom' })
  usu_nom: string;

  @Column({ name: 'dni' })
  dni: string;

  @Column({ name: 'id_sede', type: 'int', nullable: true })
  id_sede: number;

  @OneToOne(() => AccountUserOrmEntity, (account) => account.usuario)
  cuenta: AccountUserOrmEntity;
}
