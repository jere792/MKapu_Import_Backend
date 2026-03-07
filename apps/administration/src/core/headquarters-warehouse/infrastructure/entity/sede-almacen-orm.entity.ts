/* ============================================
   administration/src/core/sede-almacen/infrastructure/entity/sede-almacen-orm.entity.ts
   ============================================ */

import { Entity, Index, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'sede_almacen' })

@Index('idx_sede_almacen_sede', ['id_sede'])
@Index('idx_sede_almacen_almacen', ['id_almacen'])
@Unique('uq_sede_almacen_almacen', ['id_almacen'])

export class SedeAlmacenOrmEntity {
  @PrimaryColumn({ name: 'id_sede', type: 'int' })
  id_sede: number;

  @PrimaryColumn({ name: 'id_almacen_ref', type: 'int' })
  id_almacen: number;
}