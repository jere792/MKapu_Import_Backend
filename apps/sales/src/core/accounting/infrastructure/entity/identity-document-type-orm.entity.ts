import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'tipo_documento_identidad' })
export class IdentityDocumentTypeOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_tipo_documento' })
  id: number;

  @Column({ name: 'cod_sunat', length: 2 })
  sunatCode: string;

  @Column({ name: 'descripcion', length: 100 })
  description: string;
}
