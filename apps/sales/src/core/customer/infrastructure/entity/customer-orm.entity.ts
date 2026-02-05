/* ============================================
   sales/src/core/customer/infrastructure/entity/customer-orm.entity.ts
   ============================================ */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DocumentTypeOrmEntity } from './document-type-orm.entity';

@Entity({ name: 'cliente', schema: 'mkp_ventas' })
export class CustomerOrmEntity {
  @PrimaryColumn({ name: 'id_cliente', type: 'varchar', length: 255 })
  id_cliente: string;

  @Column({ name: 'id_tipo_documento', type: 'int' })
  id_tipo_documento: number;

  @ManyToOne(() => DocumentTypeOrmEntity)
  @JoinColumn({ name: 'id_tipo_documento' })
  tipoDocumento: DocumentTypeOrmEntity;

  @Column({ name: 'valor_doc', type: 'varchar', length: 20, unique: true })
  valor_doc: string;

  @Column({ name: 'nombres', type: 'varchar', length: 150 })
  nombres: string;

  @Column({ name: 'direccion', type: 'varchar', length: 200, nullable: true })
  direccion?: string;

  @Column({ name: 'email', type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 10, nullable: true })
  telefono?: string;

  @Column({
    name: 'estado',
    type: 'bit',
    width: 1,
    default: () => "b'1'",
    transformer: {
      to: (value: boolean) => (value ? 1 : 0),
      from: (value: Buffer | number | boolean) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;
        if (Buffer.isBuffer(value)) return value[0] === 1;
        return true;
      },
    },
  })
  estado: boolean;
}
