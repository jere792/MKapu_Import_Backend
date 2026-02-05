export interface WarrantyProps {
  id_garantia?: number;
  id_estado_garantia: number;
  id_comprobante: number;
  id_usuario_recepcion: string; // Asumiendo que es UUID o varchar del cliente/empleado
  id_sede_ref: number;
  num_garantia: string;
  fec_solicitud: Date;
  fec_recepcion?: Date;
  cod_prod: string;
  prod_nombre: string;

  // Datos extendidos
  detalles?: {
    id_detalle?: number;
    tipo_solicitud: string;
    descripcion: string;
  }[];

  seguimientos?: {
    id_seguimiento?: number;
    id_usuario_ref: string;
    fecha: Date;
    estado_anterior?: number;
    estado_nuevo: number;
    observacion: string;
  }[];

  estadoNombre?: string;
}

export class Warranty {
  private constructor(private readonly props: WarrantyProps) {}

  static create(props: WarrantyProps): Warranty {
    return new Warranty({
      ...props,
      detalles: props.detalles ?? [],
      seguimientos: props.seguimientos ?? [],
      fec_solicitud: props.fec_solicitud ?? new Date(),
    });
  }

  // Getters
  get id_garantia() {
    return this.props.id_garantia;
  }
  get id_estado_garantia() {
    return this.props.id_estado_garantia;
  }
  get id_comprobante() {
    return this.props.id_comprobante;
  }
  get id_usuario_recepcion() {
    return this.props.id_usuario_recepcion;
  }
  get id_sede_ref() {
    return this.props.id_sede_ref;
  }
  get num_garantia() {
    return this.props.num_garantia;
  }
  get fec_solicitud() {
    return this.props.fec_solicitud;
  }
  get fec_recepcion() {
    return this.props.fec_recepcion;
  }
  get cod_prod() {
    return this.props.cod_prod;
  }
  get prod_nombre() {
    return this.props.prod_nombre;
  }
  get detalles() {
    return [...(this.props.detalles || [])];
  }
  get seguimientos() {
    return [...(this.props.seguimientos || [])];
  }
  get estadoNombre() {
    return this.props.estadoNombre;
  }

  // Métodos de Negocio
  changeStatus(newStatusId: number, userId: string, observation: string) {
    const previousStatus = this.props.id_estado_garantia;
    this.props.id_estado_garantia = newStatusId;

    // Agregamos seguimiento automáticamente
    if (!this.props.seguimientos) this.props.seguimientos = [];
    this.props.seguimientos.push({
      id_usuario_ref: userId,
      fecha: new Date(),
      estado_anterior: previousStatus,
      estado_nuevo: newStatusId,
      observacion: observation,
    });
  }
}
