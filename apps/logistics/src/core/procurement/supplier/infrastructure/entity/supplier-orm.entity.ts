/* apps/logistics/src/core/procurement/supplier/infrastructure/entity/supplier-orm.entity.ts */

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BitToBooleanTransformer } from 'libs/common/src/infrastructure/transformers/bit-to-boolean.transformer';

@Entity({ name: 'proveedor' })
export class SupplierOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_proveedor', type: 'int' })
  id_proveedor: number;

  @Column({ name: 'razon_social', type: 'varchar', length: 80 })
  razon_social: string;

  @Column({ name: 'ruc', type: 'varchar', length: 11 })
  ruc: string;

  @Column({ name: 'contacto', type: 'varchar', length: 50, nullable: true })
  contacto: string;

  @Column({ name: 'email', type: 'varchar', length: 50, nullable: true })
  email: string;

  @Column({ name: 'telefono', type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ name: 'dir_fiscal', type: 'varchar', length: 100, nullable: true })
  dir_fiscal: string;

  @Column({
    name: 'estado',
    type: 'bit',
    width: 1,
    transformer: BitToBooleanTransformer,
    default: () => "b'1'",
  })
  estado: boolean;
}