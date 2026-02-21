import { RemissionCreatedEvent } from '../events/remission-created.event';
import { randomUUID } from 'crypto';
/* eslint-disable @typescript-eslint/no-unsafe-return */
export class RemissionDetail {
  constructor(
    public readonly id_producto: number,
    public readonly cod_prod: string,
    public readonly cantidad: number,
    public readonly peso_total: number,
    public readonly peso_unitario: number,
  ) {
    if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
    if (peso_total < 0) throw new Error('El peso no puede ser negativo');
    const pesoCalculado = Number((peso_unitario * cantidad).toFixed(3));
    const pesoEnviado = Number(peso_total.toFixed(3));

    if (Math.abs(pesoCalculado - pesoEnviado) > 0.001) {
      throw new Error(
        `Inconsistencia en producto ${cod_prod}: El peso total (${pesoEnviado}) no coincide con la cantidad (${cantidad}) multiplicada por el peso unitario (${peso_unitario})`,
      );
    }
  }
}
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

export interface RemissionProps {
  id_guia?: string;
  tipo_guia: RemissionType;
  serie: string;
  numero: number;
  fecha_emision: Date;
  fecha_inicio: Date;
  motivo_traslado: string;
  descripcion?: string;
  peso_total: number;
  unidad_peso: string;
  cantidad: number;
  modalidad: TransportMode;
  estado: RemissionStatus;
  observaciones?: string;

  id_comprobante_ref?: number;
  id_usuario_ref: number;
  id_sede_ref: number;
  id_almacen_origen: number;
  datos_traslado: any;
  datos_transporte: any;
}

export class Remission {
  private _domainEvents: any[] = [];
  private constructor(
    private readonly props: RemissionProps,
    private _detalles: RemissionDetail[],
  ) {}

  static createNew(
    props: Omit<
      RemissionProps,
      'id_guia' | 'estado' | 'fecha_emision' | 'peso_total' | 'cantidad'
    >,
    detalles: RemissionDetail[],
  ): Remission {
    if (!detalles || detalles.length === 0) {
      throw new Error(
        'Una guía de remisión debe tener al menos un producto (detalle).',
      );
    }
    if (props.serie.length !== 4) {
      throw new Error(
        'La serie de la guía debe tener exactamente 4 caracteres.',
      );
    }
    const fechaEmision = new Date();
    if (props.fecha_inicio < fechaEmision) {
      throw new Error(
        'La fecha de inicio del traslado no puede ser anterior a la emisión actual.',
      );
    }
    const nuevoId = randomUUID();
    const cantidadTotal = detalles.reduce((acc, det) => acc + det.cantidad, 0);
    const pesoTotal = detalles.reduce((acc, det) => acc + det.peso_total, 0);
    const remission = new Remission(
      {
        ...props,
        id_guia: nuevoId,
        fecha_emision: fechaEmision,
        estado: RemissionStatus.EMITIDO,
        cantidad: cantidadTotal,
        peso_total: pesoTotal,
      },
      detalles,
    );
    remission.addDomainEvent(
      new RemissionCreatedEvent({
        remissionId: remission.id_guia,
        warehouseId: remission.props.id_almacen_origen,
        items: remission._detalles,
        refId: remission.props.id_comprobante_ref,
        serie_numero: remission.getFullNumber(),
      }),
    );
    return remission;
  }
  addDomainEvent(event: any) {
    this._domainEvents.push(event);
  }

  get domainEvents() {
    return this._domainEvents;
  }

  clearEvents() {
    this._domainEvents = [];
  }
  validateAgainstSale(saleInfo: {
    items: { codProd: string; quantity: number }[];
  }) {
    for (const detail of this._detalles) {
      const saleItem = saleInfo.items.find(
        (i) =>
          String(i.codProd) === String(detail.cod_prod) ||
          String(i.codProd) === String(detail.id_producto),
      );
      if (!saleItem) {
        console.log('Items de la venta recibidos:', saleInfo.items);
        throw new Error(
          `El producto ${detail.cod_prod} no pertenece a la venta seleccionada.`,
        );
      }
      if (detail.cantidad > saleItem.quantity) {
        throw new Error(
          `Cantidad excedente para ${detail.cod_prod}. Vendido: ${saleItem.quantity}, Intentado: ${detail.cantidad}`,
        );
      }
    }
  }

  // Getters
  get id_guia() {
    return this.props.id_guia;
  }
  get tipo_guia() {
    return this.props.tipo_guia;
  }
  get serie() {
    return this.props.serie;
  }
  get numero() {
    return this.props.numero;
  }
  get fecha_emision() {
    return this.props.fecha_emision;
  }
  get fecha_inicio() {
    return this.props.fecha_inicio;
  }
  get motivo_traslado() {
    return this.props.motivo_traslado;
  }
  get descripcion() {
    return this.props.descripcion;
  }
  get peso_total() {
    return this.props.peso_total;
  }
  get unidad_peso() {
    return this.props.unidad_peso;
  }
  get cantidad() {
    return this.props.cantidad;
  }
  get modalidad() {
    return this.props.modalidad;
  }
  get estado() {
    return this.props.estado;
  }
  get observaciones() {
    return this.props.observaciones;
  }
  get id_almacen_origen() {
    return this.props.id_almacen_origen;
  }
  get datos_traslado() {
    return this.props.datos_traslado;
  }
  get id_comprobante_ref() {
    return this.props.id_comprobante_ref;
  }
  get id_usuario_ref() {
    return this.props.id_usuario_ref;
  }
  get id_sede_ref() {
    return this.props.id_sede_ref;
  }
  get datos_transporte() {
    return this.props.datos_transporte;
  }
  isEmitido(): boolean {
    return this.estado === RemissionStatus.EMITIDO;
  }

  isAnulado(): boolean {
    return this.estado === RemissionStatus.ANULADO;
  }

  getDetalles(): RemissionDetail[] {
    return [...this._detalles];
  }

  getFullNumber(): string {
    return `${this.serie}-${this.numero.toString().padStart(8, '0')}`;
  }

  anular(motivo: string): void {
    if (this.props.estado === RemissionStatus.ANULADO) {
      throw new Error('La guía ya se encuentra anulada');
    }
    if (this.props.estado === RemissionStatus.PROCESADO) {
      throw new Error(
        'Una guía procesada debe ser dada de baja mediante una comunicación de baja',
      );
    }
    this.props.estado = RemissionStatus.ANULADO;
    this.props.observaciones = motivo;
  }
  procesar(ticketSunat: string): void {
    if (this.props.estado !== RemissionStatus.EMITIDO) {
      throw new Error(
        `Transición inválida: No se puede procesar una guía en estado ${this.props.estado}`,
      );
    }
    if (!ticketSunat) {
      throw new Error(
        'Es obligatorio contar con el ticket de SUNAT para procesar la guía',
      );
    }
    this.props.estado = RemissionStatus.PROCESADO;
    this.props.observaciones = `Aceptado por SUNAT: ${ticketSunat}`;
  }
}
