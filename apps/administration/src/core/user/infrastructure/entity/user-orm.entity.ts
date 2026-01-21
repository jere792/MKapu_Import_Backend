/* ============================================
   administration/src/core/user/infrastructure/entity/user-orm.entity.ts
   ============================================ */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SedeOrmEntity } from '../../../headquarters/infrastructure/entity/sede-orm.entity';

@Entity('usuario')
export class UserOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'usu_nom', type: 'varchar', length: 50 })
  usu_nom: string;

  @Column({ name: 'ape_mat', type: 'varchar', length: 50 })
  ape_mat: string;

  @Column({ name: 'ape_pat', type: 'varchar', length: 50 })
  ape_pat: string;

  @Column({ name: 'dni', type: 'varchar', length: 8, unique: true })
  dni: string;

  @Column({ name: 'email', type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'celular', type: 'varchar', length: 9 })
  celular: string;

  @Column({ name: 'direccion', type: 'varchar', length: 100 })
  direccion: string;

  @Column({ name: 'genero', type: 'char', length: 1 })
  genero: string;

  @Column({ name: 'fec_nac', type: 'datetime' })
  fec_nac: Date;

  @Column({ name: 'activo', type: 'tinyint', default: 1 })
  activo: number; // 1 = true, 0 = false

  @Column({ name: 'id_sede', type: 'int', nullable: true })
  id_sede: number;

  // Relación con Sede
  @ManyToOne(() => SedeOrmEntity, (sede) => sede.usuarios, { nullable: true })
  @JoinColumn({ name: 'id_sede' })
  sede?: SedeOrmEntity;
}
