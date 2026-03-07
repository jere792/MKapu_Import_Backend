import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'tipo_comprobante' })
export class ReceiptTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_comprobante' })
  id: number;

  @Column({ name: 'cod_sunat', length: 2 })
  sunatCode: string;

  @Column({ name: 'descripcion', length: 100 })
  description: string;
}
