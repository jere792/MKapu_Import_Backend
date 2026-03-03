import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BitToBooleanTransformer } from 'libs/common/src';

@Entity({ name: 'almacen', schema: 'mkp_logistica' })
export class WarehouseOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_almacen', type: 'int' })
  id_almacen!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 10, unique: true })
  codigo!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 50, nullable: true })
  nombre?: string;

  @Column({ name: 'departamento', type: 'varchar', length: 50, nullable: true })
  departamento?: string;

  @Column({ name: 'provincia', type: 'varchar', length: 50, nullable: true })
  provincia?: string;

  @Column({ name: 'ciudad', type: 'varchar', length: 50, nullable: true })
  ciudad?: string;

  @Column({ name: 'direccion', type: 'varchar', length: 100, nullable: true })
  direccion?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 15, nullable: true })
  telefono?: string;

  @Column({
    name: 'activo',
    type: 'bit',
    width: 1,
    transformer: BitToBooleanTransformer,
    default: () => "b'1'",
  })
  activo!: boolean;

  @Column({ name: 'id_sede', type: 'int', nullable: false })
  sedeId?: number;
}