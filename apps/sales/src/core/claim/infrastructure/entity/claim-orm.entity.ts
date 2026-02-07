import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ClaimStatus } from "../../domain/entity/claim-detail-domain-entity";
import { SalesReceiptOrmEntity } from "../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity";

export class ClaimOrmEntity {

    @PrimaryGeneratedColumn()
    id_reclamo: number; 

    @Column()
    id_vendedor_ref: string;

    @Column()
    id_comprobante: number;

    @Column()
    motivo: string;

    @Column()
    descripcion: string

    @Column({
        type: "enum",
        enum: ClaimStatus,
        default: ClaimStatus.REGISTRADO,
    })
    estado: ClaimStatus;

    @Column()
    fecha_registro: Date;

    @Column({ type: 'datetime', nullable: true })
    fecha_resolucion?: Date;

    @ManyToOne(() => SalesReceiptOrmEntity)
    @JoinColumn({ name: 'id_comprobante' })
    comprobante: SalesReceiptOrmEntity;
}