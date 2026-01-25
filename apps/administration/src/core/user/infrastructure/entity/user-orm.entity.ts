/* eslint-disable prettier/prettier */
/* ============================================
   administration/src/core/user/infrastructure/entity/user-orm.entity.ts
   ============================================ */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { HeadquartersOrmEntity } from '../../../headquarters/infrastructure/entity/headquarters-orm.entity';
import { BitToBooleanTransformer } from 'libs/common/src/infrastructure/transformers/bit-to-boolean.transformer';

@Entity({ name: 'usuario', schema: 'mkp_administracion' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'nombres', length: 100 })
  nombres: string;

  @Column({ name: 'ape_mat', type: 'varchar', length: 50 })
  ape_mat: string;

  @Column({ name: 'ape_pat', type: 'varchar', length: 50 })
  ape_pat: string;

  @Column({ name: 'dni', type: 'varchar', length: 8, unique: true })
  dni: string;

  @Column({ name: 'email', type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ name: 'celular', type: 'varchar', length: 9 })
  celular: string;

  @Column({ name: 'direccion', type: 'varchar', length: 100 })
  direccion: string;

  @Column({ name: 'genero', type: 'char', length: 1 })
  genero: string;

  @Column({ name: 'fec_nac', type: 'datetime' })
  fec_nac: Date;

  @Column({
    name: 'activo',
    type: 'bit',
    width: 1,
    transformer: BitToBooleanTransformer,
    default: () => "b'1'",
  })
  activo: boolean;

  @Column({ name: 'id_sede', type: 'int', nullable: true })
  id_sede: number;

  // Relación con Sede
  @ManyToOne(() => HeadquartersOrmEntity, (headquarters) => headquarters.usuarios, { nullable: true })
  @JoinColumn({ name: 'id_sede' })
  sede?: HeadquartersOrmEntity;
}
