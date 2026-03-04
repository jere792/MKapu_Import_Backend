/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { SalesReceiptOrmEntity } from '../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';

@Entity({ name: 'cpe_documento'})
export class CpeDocumentOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_cpe' })
  id: number;

  @Column({ name: 'id_comprobante' })
  receiptId: number;

  @Column({ name: 'hash_cpe' })
  hash: string;

  @Column({ name: 'xml_cpe', type: 'text' })
  xmlContent: string;

  @Column({ name: 'cdr_cpe', type: 'text' })
  cdrContent: string;

  @Column({
    name: 'estado_envio',
    type: 'enum',
    enum: ['ENVIADO', 'ACEPTADO', 'OBSERVADO'],
  })
  shippingStatus: string;

  @Column({ name: 'fec_envio' })
  sentAt: Date;

  @OneToOne(() => SalesReceiptOrmEntity)
  @JoinColumn({ name: 'id_comprobante' })
  receipt: SalesReceiptOrmEntity;
}
