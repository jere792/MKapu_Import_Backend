/* ============================================
   sales/src/core/salesreceipt/infrastructure/entity/sales-type-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum SalesTypeOrmEnum {
  PRESENCIAL = 'PRESENCIAL',
  DELIVERY = 'DELIVERY',
  RECOJO_TIENDA = 'RECOJO_TIENDA',
  ENVIO_PROVINCIA = 'ENVIO_PROVINCIA',
}

@Entity('tipo_venta')
export class SalesTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_venta' })
  id_tipo_venta: number;

  @Column({ type: 'enum', enum: SalesTypeOrmEnum, name: 'tipo' })
  tipo: SalesTypeOrmEnum;

  @Column({ type: 'varchar', length: 255, name: 'descripcion' })
  descripcion: string;
}
