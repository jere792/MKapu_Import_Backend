import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'cuenta_usuario' })
@Unique(['id_usuario']) 
export class CuentaUsuarioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_cuenta', type: 'int' })
  id_cuenta: number;

  @Column({ name: 'id_usuario', type: 'int', unique: true })
  id_usuario: number;

  @Column({ name: 'id_sede', type: 'int' })
  id_sede: number;

  @Column({ name: 'nom_usu', type: 'varchar', length: 50 })
  nom_usu: string;

  @Column({ name: 'contraseña', type: 'varchar', length: 255 })
  contraseña: string;

  @Column({ name: 'email_emp', type: 'varchar', length: 150 })
  email_emp: string;

  @Column({
    name: 'activo',
    type: 'bit',
    default: true,
  })
  activo: boolean;

  @Column({ name: 'ultimo_acceso', type: 'datetime' })
  ultimo_acceso: Date;
}