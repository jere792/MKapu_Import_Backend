/* auth/src/core/infrastructure/entity/user-orm-entity.ts */
import { Column, Entity, OneToOne } from 'typeorm';
import { AccountUserOrmEntity } from './account-user-orm-entity';

@Entity('usuario')
export class UserOrmEntity {
  @Column({ primary: true })
  id: number;
  @Column()
  usu_nombre: string;
  @Column()
  ape_mat: string;
  @Column()
  ape_pat: string;
  @Column()
  dni: string;
  @Column()
  email: string;
  @Column()
  celular: string;
  @Column()
  direccion: string;
  @Column()
  genero: string;
  @Column()
  fec_nac: Date;
  @Column()
  activo: number;
  @OneToOne(() => AccountUserOrmEntity, (account) => account.usuario)
  cuenta: AccountUserOrmEntity;
}
