import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RemissionType {
  REMITENTE,
  TRANSPORTISTA,
}
export enum TransportMode {
  PUBLICO,
  PRIVADO,
}
export enum RemissionStatus {
  EMITIDO,
  ANULADO,
  PROCESADO,
}
@Entity('guia_remision')
export class RemissionOrmEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id_guia' })
  id_guia: string;

  @Column({
    type: 'enum',
    enum: RemissionType,
    name: 'tipo_guia',
    default: RemissionType.REMITENTE,
  })
  tipo_guia: RemissionType;

  @Column({ type: 'char', length: 4, name: 'serie' })
  serie: string;

  @Column({ type: 'int', name: 'numero' })
  numero: number;

  @Column({
    type: 'datetime',
    name: 'fecha_emision',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_emision: Date;

  @Column({ type: 'datetime', name: 'fecha_inicio' })
  fecha_inicio: Date;

  @Column({ type: 'varchar', length: 100, name: 'motivo_traslado' })
  motivo_traslado: string;

  @Column({ type: 'varchar', length: 255, name: 'descripcion', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'peso_total' })
  peso_total: number;

  @Column({ type: 'varchar', length: 10, name: 'unidad_peso' })
  unidad_peso: string;

  @Column({ type: 'int', name: 'cantidad' })
  cantidad: number;

  @Column({
    type: 'enum',
    enum: TransportMode,
    name: 'modalidad',
    default: TransportMode.PRIVADO,
  })
  modalidad: TransportMode;

  @Column({
    type: 'enum',
    enum: RemissionStatus,
    name: 'estado',
    default: RemissionStatus.EMITIDO,
  })
  estado: RemissionStatus;

  @Column({ type: 'text', name: 'observaciones', nullable: true })
  observaciones: string;

  @Column({ type: 'int', name: 'id_almacen_origen', nullable: false })
  id_almacen_origen: number;

  @Column({ name: 'id_comprobante_ref', type: 'int', nullable: false })
  id_comprobante_ref: number;

  @Column({ name: 'id_usuario_ref', type: 'int' })
  id_usuario_ref: number;

  @Column({ name: 'id_sede_ref', type: 'int' })
  id_sede_ref: string;
}
