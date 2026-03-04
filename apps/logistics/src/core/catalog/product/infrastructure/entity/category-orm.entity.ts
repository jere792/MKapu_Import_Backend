import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BitToBooleanTransformer } from 'libs/common/src';

@Entity({ name: 'categoria' })
export class CategoryOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_categoria', type: 'int' })
  id_categoria: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 50 })
  descripcion: string;

  @Column({
    name: 'activo',
    type: 'bit',
    width: 1,
    transformer: BitToBooleanTransformer,
  })
  activo: boolean;
}
