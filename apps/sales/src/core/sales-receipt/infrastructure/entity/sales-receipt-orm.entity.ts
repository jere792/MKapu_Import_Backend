import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { SalesTypeOrmEntity } from './sales-type-orm.entity';
import { ReceiptTypeOrmEntity } from './receipt-type-orm.entity';
import { SunatCurrencyOrmEntity } from './sunat-currency-orm.entity';
import { CustomerOrmEntity } from '../../../customer/infrastructure/entity/customer-orm.entity';
import { SalesReceiptDetailOrmEntity } from './sales-receipt-detail-orm.entity';

export enum ReceiptStatusOrm {
  EMITIDO   = 'EMITIDO',
  PENDIENTE = 'PENDIENTE', 
  ANULADO   = 'ANULADO',
  RECHAZADO = 'RECHAZADO',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
}
@Entity('comprobante_venta')
export class SalesReceiptOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_comprobante' })
  id_comprobante: number;

  @ManyToOne(() => CustomerOrmEntity)
  @JoinColumn({ name: 'id_cliente' })
  cliente: CustomerOrmEntity;

  @ManyToOne(() => SalesTypeOrmEntity)
  @JoinColumn({ name: 'id_tipo_venta' })
  tipoVenta: SalesTypeOrmEntity;

  @ManyToOne(() => ReceiptTypeOrmEntity)
  @JoinColumn({ name: 'id_tipo_comprobante' })
  tipoComprobante: ReceiptTypeOrmEntity;

  @ManyToOne(() => SunatCurrencyOrmEntity)
  @JoinColumn({ name: 'cod_moneda', referencedColumnName: 'codigo' })
  moneda: SunatCurrencyOrmEntity;

  @OneToMany(() => SalesReceiptDetailOrmEntity, (detail) => detail.receipt, {
    cascade: true,
  })
  details: SalesReceiptDetailOrmEntity[];

  @Column({ type: 'char', length: 4, name: 'serie' })
  serie: string;

  @Column({ type: 'int', name: 'numero' })
  numero: number;

  @Column({
    type: 'datetime',
    name: 'fec_emision',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fec_emision: Date;

  @Column({ type: 'datetime', name: 'fec_venc' })
  fec_venc: Date;

  @Column({ type: 'char', length: 4, name: 'tipo_operacion' })
  tipo_operacion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  igv: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  isc: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: ReceiptStatusOrm,
    default: ReceiptStatusOrm.EMITIDO, 
  })
  estado: ReceiptStatusOrm;

  @Column({ type: 'varchar', length: 255 })
  id_responsable_ref: string;

  @Column({ type: 'int' })
  id_sede_ref: number;
}
