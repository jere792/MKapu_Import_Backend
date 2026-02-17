/* ============================================
   administration/src/core/role/infrastructure/entity/role-orm.entity.ts
   ============================================ */

import { BitToBooleanTransformer } from 'libs/common/src/infrastructure/transformers/bit-to-boolean.transformer';

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rol')
export class RoleOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_rol', type: 'int' }) 
  id_rol: number;

  @Column({ name: 'nombre', type: 'varchar', length: 45 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 45, nullable: true })
  descripcion: string;

  @Column({
    name: 'activo',
    type: 'bit',
    transformer: BitToBooleanTransformer,
    default: () => "b'1'", 
  })
  activo: boolean;
}
