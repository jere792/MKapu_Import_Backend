import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('empresa')
export class EmpresaOrmEntity {
  @PrimaryColumn()
  id: number;

  @Column({ name: 'nombre_comercial', length: 100 })
  nombreComercial: string;

  @Column({ name: 'razon_social', length: 150, nullable: true })
  razonSocial: string | null;

  @Column({ length: 11 })
  ruc: string;

  @Column({ name: 'sitio_web', length: 200, nullable: true })
  sitioWeb: string | null;

  @Column({ length: 200, nullable: true })
  direccion: string | null;

  @Column({ length: 100, nullable: true })
  ciudad: string | null;

  @Column({ length: 100, nullable: true })
  departamento: string | null;

  @Column({ length: 20, nullable: true })
  telefono: string | null;

  @Column({ length: 100, nullable: true })
  email: string | null;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'logo_public_id', length: 200, nullable: true })
  logoPublicId: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
