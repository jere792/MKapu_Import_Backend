import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreditNoteItemOrmEntity } from './credit-note-item-orm.entity';
import {
  CreditNoteBusinessType,
  CreditNoteStatus,
} from '../../../domain/entity/credit-note.types';
import { SalesReceiptOrmEntity } from 'apps/sales/src/core/sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { TypeCreditNoteOrmEntity } from 'apps/sales/src/core/type-credit-note/infrastructure/entity/type-credit-note-orm.entity';

@Entity({ name: 'nota_credito' })
export class CreditNoteOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_nota_credito' })
  creditNoteId: number;

  @Column({ type: 'int', name: 'id_comprobante_ref' })
  receiptIdRef: number;

  @Column({ type: 'varchar', name: 'serie_comprobante', length: 4 })
  serieRef: string;

  @Column({ type: 'int', name: 'numero_comprobante' })
  numberDocRef: number;

  @Column({ type: 'varchar', name: 'serie', length: 4 })
  serie: string;

  @Column({ type: 'int', name: 'numero_documento' })
  numberDoc: number;

  @CreateDateColumn({ name: 'fecha_emision' })
  issueDate: Date;

  @Column({ type: 'int', name: 'id_cliente' })
  clientId: number;

  @Column({ type: 'varchar', name: 'razon_social_cliente' })
  clientName: string;

  @Column({ type: 'varchar', name: 'tipo_moneda' })
  currency: string;

  @Column({ type: 'varchar', name: 'num_nota_credito' })
  correlative: string;

  @Column({ type: 'int', name: 'id_tipo_nota' })
  typeNoteId: number;

  @Column({ type: 'decimal', name: 'total_venta', precision: 10, scale: 2 })
  saleValue: number;

  @Column({ type: 'decimal', name: 'isc', precision: 10, scale: 2 })
  isc: number;

  @Column({ type: 'decimal', name: 'igv', precision: 10, scale: 2 })
  igv: number;

  @Column({ type: 'int', name: 'cantidad_total' })
  totalAmount: number;

  @Column({
    type: 'enum',
    name: 'tipo_devolucion',
    enum: CreditNoteBusinessType,
    default: CreditNoteBusinessType.FULL_REFUND,
  })
  businessType: CreditNoteBusinessType;

  @Column({
    type: 'enum',
    name: 'estado',
    enum: CreditNoteStatus,
    default: CreditNoteStatus.ISSUED,
  })
  status: CreditNoteStatus;

  @Column({ type: 'int', name: 'id_usuario_ref' })
  userRefId: number;

  @Column({ name: 'usuario_sistema' })
  userRefName: string;

  @Column({ type: 'int', name: 'id_sede_ref' })
  headquarterId: number;

  @Column({ name: 'nombre_sede' })
  headquarterName: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt: Date;

  @OneToMany(() => CreditNoteItemOrmEntity, (item) => item.creditNote, {
    cascade: true,
  })
  items: CreditNoteItemOrmEntity[];

  @ManyToOne(() => SalesReceiptOrmEntity, { eager: false })
  @JoinColumn({ name: 'id_comprobante_ref' })
  receipt: SalesReceiptOrmEntity;

  @ManyToOne(() => TypeCreditNoteOrmEntity, { eager: false })
  @JoinColumn({ name: 'id_tipo_nota' })
  typeNote: TypeCreditNoteOrmEntity;
}
