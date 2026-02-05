import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipo_pago')
export class PaymentTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_pago' })
  id: number;

  @Column({ name: 'cod_tipo_sunat', type: 'char', length: 3 })
  codSunat: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 200 })
  descripcion: string;
}
