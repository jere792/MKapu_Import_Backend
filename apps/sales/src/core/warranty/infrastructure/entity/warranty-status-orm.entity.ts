import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'estado_garantia', schema: 'mkp_ventas' })
export class WarrantyStatusOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_estado', type: 'int' })
  id_estado: number;

  @Column({ name: 'cod_estado', type: 'varchar', length: 50 })
  cod_estado: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 150, nullable: true })
  descripcion: string;
}
