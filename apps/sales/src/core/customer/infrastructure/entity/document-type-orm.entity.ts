
/* ============================================
   sales/src/core/customer/infrastructure/entity/document-type-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tipo_documento_identidad' })
export class DocumentTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_documento', type: 'int' })
  id_tipo_documento: number;

  @Column({ name: 'cod_sunat', type: 'char', length: 2 })
  cod_sunat: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 100 })
  descripcion: string;
}
