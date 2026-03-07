/* eslint-disable prettier/prettier */
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'usuario' })
export class UserOrmEntity {
  @PrimaryColumn({ name: 'id_usuario', type: 'int' })
  id_usuario: number;

  @Column({ name: 'nombres', type: 'varchar', length: 100 })
  nombres: string;

  @Column({ name: 'ape_pat', type: 'varchar', length: 50 })
  ape_pat: string;

  @Column({ name: 'ape_mat', type: 'varchar', length: 50 })
  ape_mat: string;

  @Column({ name: 'dni', type: 'varchar', length: 8 })
  dni: string;

  @Column({ name: 'email', type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ name: 'celular', type: 'varchar', length: 9, nullable: true })
  celular: string;

  @Column({ name: 'direccion', type: 'varchar', length: 100, nullable: true })
  direccion: string;

  @Column({ name: 'genero', type: 'char', length: 1, nullable: true })
  genero: string;

  @Column({ name: 'fec_nac', type: 'datetime' })
  fec_nac: Date;

  @Column({
    name: 'activo',
    type: 'bit',
    transformer: {
      from: (value: Buffer | number) => value === 1 || (Buffer.isBuffer(value) && value[0] === 1),
      to: (value: boolean) => (value ? 1 : 0),
    },
  })
  activo: boolean;
}
