import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { QuoteOrmEntity } from './quote-orm.entity';

@Entity('cliente') 
export class CustomerOrmEntity {
  @PrimaryColumn({ length: 255 })
  id_cliente: string;

  @Column()
  id_tipo_documento: number;

  @Column({ length: 150 })
  nombres: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 10, nullable: true })
  telefono: string;

  @Column({ type: 'bit', transformer: { to: (v) => v, from: (v) => !!v[0] } })
  estado: boolean;

  @Column({ length: 20, unique: true })
  valor_doc: string;

  // Relación: Un cliente tiene muchas cotizaciones
  @OneToMany(() => QuoteOrmEntity, (quote) => quote.customer)
  quotes: QuoteOrmEntity[];
}