import { DispatchDetail, DispatchDetailStatus } from './dispatch-detail-domain-entity';

export enum DispatchStatus {
  GENERADO = 'GENERADO',
  EN_PREPARACION = 'EN_PREPARACION',
  EN_TRANSITO = 'EN_TRANSITO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export class Dispatch {
  private constructor(
    public readonly id_despacho: number | null,
    public readonly id_venta_ref: number,
    public readonly id_usuario_ref: string,
    public readonly id_almacen_origen: number,
    public fecha_creacion: Date,
    public fecha_programada: Date | null,
    public fecha_salida: Date | null,
    public fecha_entrega: Date | null,
    public direccion_entrega: string,
    public observacion: string | null,
    public estado: DispatchStatus,
    public detalles: DispatchDetail[],
  ) {
    this.validate();
  }

  static create(props: {
    id_despacho?: number;
    id_venta_ref: number;
    id_usuario_ref: string;
    id_almacen_origen: number;
    fecha_programada?: Date;
    direccion_entrega: string;
    observacion?: string;
    detalles?: DispatchDetail[];
  }): Dispatch {
    if (!props.id_venta_ref)
      throw new Error('La referencia de venta es obligatoria');
    if (!props.id_usuario_ref?.trim())
      throw new Error('El usuario es obligatorio');
    if (!props.id_almacen_origen)
      throw new Error('El almacén de origen es obligatorio');
    if (!props.direccion_entrega?.trim())
      throw new Error('La dirección de entrega es obligatoria');

    return new Dispatch(
      props.id_despacho ?? null,
      props.id_venta_ref,
      props.id_usuario_ref,
      props.id_almacen_origen,
      new Date(),
      props.fecha_programada ?? null,
      null,
      null,
      props.direccion_entrega,
      props.observacion ?? null,
      DispatchStatus.GENERADO,
      props.detalles ?? [],
    );
  }

  iniciarPreparacion(): void {
    if (this.estado !== DispatchStatus.GENERADO)
      throw new Error('Solo se puede preparar un despacho en estado GENERADO');
    if (this.detalles.length === 0)
      throw new Error('El despacho debe tener al menos un detalle');
    this.estado = DispatchStatus.EN_PREPARACION;
  }

  iniciarTransito(fechaSalida: Date): void {
    if (this.estado !== DispatchStatus.EN_PREPARACION)
      throw new Error('Solo se puede enviar un despacho en estado EN_PREPARACION');
    if (this.detalles.some(d => d.estado === DispatchDetailStatus.PENDIENTE))
      throw new Error('Todos los detalles deben estar preparados o marcados como faltantes antes de iniciar el tránsito');

    this.fecha_salida = fechaSalida;
    this.estado = DispatchStatus.EN_TRANSITO;
  }

  confirmarEntrega(fechaEntrega: Date): void {
    if (this.estado !== DispatchStatus.EN_TRANSITO)
      throw new Error('Solo se puede entregar un despacho en estado EN_TRANSITO');

    this.fecha_entrega = fechaEntrega;
    this.estado = DispatchStatus.ENTREGADO;
  }

  cancelar(motivo?: string): void {
    if (this.estado === DispatchStatus.ENTREGADO)
      throw new Error('No se puede cancelar un despacho ya entregado');
    if (this.estado === DispatchStatus.CANCELADO)
      throw new Error('El despacho ya está cancelado');

    if (motivo) this.observacion = motivo;
    this.estado = DispatchStatus.CANCELADO;
  }

  agregarDetalle(detalle: DispatchDetail): void {
    if (this.estado !== DispatchStatus.GENERADO)
      throw new Error('Solo se pueden agregar detalles a un despacho en estado GENERADO');
    const existe = this.detalles.some(d => d.id_producto === detalle.id_producto);
    if (existe)
      throw new Error(`El producto ${detalle.id_producto} ya está en el despacho`);
    this.detalles.push(detalle);
  }

  get tieneFaltantes(): boolean {
    return this.detalles.some(d => d.tieneFaltante);
  }

  get estaActivo(): boolean {
    return ![DispatchStatus.ENTREGADO, DispatchStatus.CANCELADO].includes(this.estado);
  }

  private validate(): void {
    if (this.fecha_programada && this.fecha_programada < this.fecha_creacion)
      throw new Error('La fecha programada no puede ser anterior a la fecha de creación');
    if (this.fecha_salida && this.fecha_entrega && this.fecha_entrega < this.fecha_salida)
      throw new Error('La fecha de entrega no puede ser anterior a la fecha de salida');
  }
}