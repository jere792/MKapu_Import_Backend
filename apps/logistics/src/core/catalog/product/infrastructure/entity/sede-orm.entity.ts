import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BitToBooleanTransformer } from 'libs/common/src';

@Entity({ name: 'sede' })
export class SedeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_sede', type: 'int' })
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

  @Column({
    name: 'activo',
    type: 'bit',
    width: 1,
    transformer: BitToBooleanTransformer,
    default: () => "b'1'",
  })
  activo: boolean;
}
