/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* sales/src/core/warranty/infrastructure/entity/warranty-orm.entity.ts */
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SalesReceiptOrmEntity } from '../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { CustomerOrmEntity } from '../../../customer/infrastructure/entity/customer-orm.entity';
import { WarrantyStatusOrmEntity } from './warranty-status-orm.entity';
import { WarrantyTrackingOrmEntity } from './warranty-tracking-orm.entity';
import { WarrantyDetailOrmEntity } from './warranty-detail-orm.entity';

@Entity({ name: 'garantia', schema: 'mkp_ventas' })
export class WarrantyOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_garantia', type: 'int' })
  id_garantia: number;

  @ManyToOne(() => WarrantyStatusOrmEntity)
  @JoinColumn({ name: 'id_estado_garantia' })
  estado: WarrantyStatusOrmEntity;

  @ManyToOne(() => SalesReceiptOrmEntity)
  @JoinColumn({ name: 'id_comprobante' })
  comprobante: SalesReceiptOrmEntity;

  @ManyToOne(() => CustomerOrmEntity)
  @JoinColumn({ name: 'id_usuario_recepcion' })
  cliente: CustomerOrmEntity;

  @Column({ name: 'id_sede_ref', type: 'int' })
  id_sede_ref: number;

  @Column({ name: 'num_garantia', type: 'varchar', length: 20 })
  num_garantia: string;

  @Column({ name: 'fec_solicitud', type: 'datetime' })
  fec_solicitud: Date;

  @Column({ name: 'fec_recepcion', type: 'datetime', nullable: true })
  fec_recepcion: Date;

  @Column({ name: 'cod_prod', type: 'varchar', length: 50 })
  cod_prod: string;

  @Column({ name: 'prod_nombre', type: 'varchar', length: 150 })
  prod_nombre: string;

  @OneToMany(() => WarrantyDetailOrmEntity, (detail) => detail.warranty, { cascade: true })
  details: WarrantyDetailOrmEntity[];

  @OneToMany(() => WarrantyTrackingOrmEntity, (track) => track.warranty, { cascade: true })
  tracking: WarrantyTrackingOrmEntity[];
}
