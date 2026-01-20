/* ============================================
   administration/src/core/headquarters/infrastructure/entity/sede-orm.entity.ts
   ============================================ */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserOrmEntity } from '../../../user/infrastructure/entity/user-orm.entity';

@Entity('sede')
export class SedeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_sede' })
  id_sede: number;

  @Column({ name: 'codigo', type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre: string;

  @Column({ name: 'ciudad', type: 'varchar', length: 50 })
  ciudad: string;

  @Column({ name: 'departamento', type: 'varchar', length: 50 })
  departamento: string;

  @Column({ name: 'direccion', type: 'varchar', length: 100 })
  direccion: string;

  @Column({ name: 'telefono', type: 'varchar', length: 10 })
  telefono: string;

  @Column({ name: 'activo', type: 'tinyint', default: 1 })
  activo: number; // 1 = activo, 0 = inactivo

  // Relación inversa con usuarios
  @OneToMany(() => UserOrmEntity, (user) => user.sede)
  usuarios?: UserOrmEntity[];
}