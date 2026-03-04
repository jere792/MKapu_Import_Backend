import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cuenta_rol' })
export class CuentaRolOrmEntity {
  @PrimaryColumn({ name: 'id_rol', type: 'int' })
  id_rol: number;

  @PrimaryColumn({ name: 'id_cuenta', type: 'int' })
  id_cuenta: number;
}