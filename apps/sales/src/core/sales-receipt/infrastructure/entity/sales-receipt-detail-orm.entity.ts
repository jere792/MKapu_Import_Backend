import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesReceiptOrmEntity } from './sales-receipt-orm.entity';

@Entity('detalle_comprobante')
export class SalesReceiptDetailOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  id_detalle: number;

  @Column({ name: 'id_prod_ref', length: 45, nullable: true })
  id_prod_ref: string;

  @Column({ name: 'cod_prod', length: 45, nullable: true })
  cod_prod: string;

  @Column({ name: 'descripcion', length: 45, nullable: true })
  descripcion: string;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad: number;

  @Column({ name: 'pre_uni', type: 'decimal', precision: 10, scale: 2 })
  pre_uni: number;

  @Column({ name: 'valor_uni', type: 'decimal', precision: 10, scale: 2 })
  valor_uni: number;

  @Column({ name: 'igv', type: 'decimal', precision: 10, scale: 2 })
  igv: number;

  @Column({ name: 'tipo_afectacion_igv', type: 'int' })
  tipo_afectacion_igv: number;

  @Column({ name: 'id_descuento', type: 'int', default: 0 })
  id_descuento: number;

  @Column({ name: 'id_comprobante' })
  id_comprobante: number;

  @ManyToOne(() => SalesReceiptOrmEntity, (receipt) => receipt.details)
  @JoinColumn({ name: 'id_comprobante' })
  receipt: SalesReceiptOrmEntity;
}
