/* ============================================
   logistics/src/core/warehouse/store/infrastructure/entity/store-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'almacen', schema: 'mkp_logistica' })
export class StoreOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_almacen', type: 'int' })
  id_almacen: number;

  @Column({
    name: 'codigo',
    type: 'varchar',
    length: 10,
    unique: true,
    nullable: false,
  })
  codigo: string;

  @Column({ name: 'nombre', type: 'varchar', length: 50, nullable: true })
  nombre: string | null;

  @Column({ name: 'ciudad', type: 'varchar', length: 50, nullable: true })
  ciudad: string | null;

  @Column({ name: 'direccion', type: 'varchar', length: 100, nullable: true })
  direccion: string | null;

  @Column({ name: 'telefono', type: 'varchar', length: 15, nullable: true })
  telefono: string | null;

  @Column({
    name: 'activo',
    type: 'bit',
    width: 1,
    nullable: false,
    default: () => "b'1'",
  })
  activo: boolean;
}
