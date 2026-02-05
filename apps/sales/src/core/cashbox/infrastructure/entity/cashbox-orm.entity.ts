/* ============================================
   administration/src/core/cashbox/infrastructure/entity/cashbox-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('caja')
export class CashboxOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id_caja: string;

  @Column({ type: 'int' })
  id_sede_ref: number;

  @Column({
    type: 'enum',
    enum: ['ABIERTA', 'CERRADA'],
    default: 'ABIERTA',
  })
  estado: 'ABIERTA' | 'CERRADA';

  @CreateDateColumn({
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fec_apertura: Date;

  @Column({ type: 'datetime', nullable: true })
  fec_cierre: Date | null;
}
