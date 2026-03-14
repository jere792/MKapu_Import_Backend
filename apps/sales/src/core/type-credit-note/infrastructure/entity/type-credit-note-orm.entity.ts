import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('tipo_nota_credito', { schema: 'mkp_ventas' })
export class TypeCreditNoteOrmEntity {

    @PrimaryGeneratedColumn({ name: 'id_tipo_nota' })
    id_tipo_nota: number;

    @Column({ name: 'codigo_sunat', type: 'varchar', length: 20, unique: true })
    codigo_sunat: string;
    
    @Column({ name: 'descripcion', type: 'varchar', length: 255 })
    descripcion: string;
}