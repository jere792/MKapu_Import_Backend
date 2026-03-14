import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CreditNoteOrmEntity } from "./credit-note-orm.entity";

@Entity({ name: 'detalle_nota', schema: 'mkp_ventas' })
export class CreditNoteItemOrmEntity {

    @PrimaryGeneratedColumn({ name: 'id_item_nota' })
    itemId: number;

    @Column({ name: 'id_producto', nullable: true })
    productId?: number;

    @Column({ type: 'varchar', name: 'prod_descripcion', length: 150 })
    description: string;

    @Column({ type: 'int', name: 'cantidad' })
    quantity: number;

    @Column({ type: 'decimal', name: 'precio_unitario', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', name: 'subtotal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ type: 'decimal', name: 'igv', precision: 10, scale: 2 })
    igv: number;

    @Column({ type: 'decimal', name: 'total', precision: 10, scale: 2 })
    total: number;

    @ManyToOne(() => CreditNoteOrmEntity, (creditNote) => creditNote.items)
    @JoinColumn({ name: 'id_nota_credito' })
    creditNote: CreditNoteOrmEntity;
}