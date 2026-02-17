/* sales/src/core/salesreceipt/domain/entity/sales-receipt.ts */

export enum ReceiptStatus {
  EMITIDO = 'EMITIDO',
  ANULADO = 'ANULADO',
  RECHAZADO = 'RECHAZADO',
}

export interface SalesReceiptItem {
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
  total?: number;
  igv?: number;
}

export interface SalesReceiptProps {
  id_comprobante?: number;
  id_cliente: string;
  id_tipo_venta: number;
  id_tipo_comprobante: number;
  serie: string;
  numero: number;
  fec_emision: Date;
  fec_venc: Date;
  tipo_operacion: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  estado: ReceiptStatus;
  id_responsable_ref: string;
  id_sede_ref: number;
  cod_moneda: string;
  items: SalesReceiptItem[]; 
}

export class SalesReceipt {
  private constructor(private readonly props: SalesReceiptProps) {}

  static create(props: SalesReceiptProps): SalesReceipt {
    // Validaciones de formato
    if (props.serie.length !== 4) {
      throw new Error('La serie debe tener exactamente 4 caracteres');
    }
    if (props.tipo_operacion.length !== 4) {
      throw new Error(
        'El tipo de operación debe tener exactamente 4 caracteres',
      );
    }
    if (props.cod_moneda.length !== 3) {
      throw new Error(
        'El código de moneda debe tener exactamente 3 caracteres',
      );
    }
    if (props.numero <= 0) {
      throw new Error('El número del comprobante debe ser mayor a 0');
    }
    if (props.total < 0 || props.subtotal < 0 || props.igv < 0) {
      throw new Error('Los montos no pueden ser negativos');
    }
    if (!props.items || props.items.length === 0) {
      throw new Error('El comprobante debe contener al menos un item');
    }

    return new SalesReceipt(props);
  }

  static createNew(
    id_cliente: string,
    id_tipo_venta: number,
    id_tipo_comprobante: number,
    serie: string,
    numero: number,
    fec_emision: Date,
    fec_venc: Date,
    tipo_operacion: string,
    subtotal: number,
    igv: number,
    isc: number,
    total: number,
    id_responsable_ref: string,
    id_sede_ref: number,
    cod_moneda: string,
    items: SalesReceiptItem[] = [],
  ): SalesReceipt {
    return SalesReceipt.create({
      id_cliente,
      id_tipo_venta,
      id_tipo_comprobante,
      serie,
      numero,
      fec_emision,
      fec_venc,
      tipo_operacion,
      subtotal,
      igv,
      isc,
      total,
      estado: ReceiptStatus.EMITIDO,
      id_responsable_ref,
      id_sede_ref,
      cod_moneda,
      items,
    });
  }

  get items(): SalesReceiptItem[] {
    return this.props.items;
  }

  set items(value: SalesReceiptItem[]) {
    this.props.items = value;
  }

  get id_comprobante(): number | undefined {
    return this.props.id_comprobante;
  }
  get id_cliente(): string {
    return this.props.id_cliente;
  }
  get id_tipo_venta(): number {
    return this.props.id_tipo_venta;
  }
  get id_tipo_comprobante(): number {
    return this.props.id_tipo_comprobante;
  }
  get serie(): string {
    return this.props.serie;
  }
  get numero(): number {
    return this.props.numero;
  }
  get fec_emision(): Date {
    return this.props.fec_emision;
  }
  get fec_venc(): Date {
    return this.props.fec_venc;
  }
  get tipo_operacion(): string {
    return this.props.tipo_operacion;
  }
  get subtotal(): number {
    return this.props.subtotal;
  }
  get igv(): number {
    return this.props.igv;
  }
  get isc(): number {
    return this.props.isc;
  }
  get total(): number {
    return this.props.total;
  }
  get estado(): ReceiptStatus {
    return this.props.estado;
  }
  get id_responsable_ref(): string {
    return this.props.id_responsable_ref;
  }
  get id_sede_ref(): number {
    return this.props.id_sede_ref;
  }
  get cod_moneda(): string {
    return this.props.cod_moneda;
  }

  // Métodos de utilidad y negocio
  isEmitido(): boolean {
    return this.estado === ReceiptStatus.EMITIDO;
  }
  isAnulado(): boolean {
    return this.estado === ReceiptStatus.ANULADO;
  }
  isRechazado(): boolean {
    return this.estado === ReceiptStatus.RECHAZADO;
  }

  getFullNumber(): string {
    return `${this.serie}-${this.numero.toString().padStart(8, '0')}`;
  }

  anular(): SalesReceipt {
    if (this.estado === ReceiptStatus.ANULADO)
      throw new Error('El comprobante ya está anulado');
    if (this.estado === ReceiptStatus.RECHAZADO)
      throw new Error('No se puede anular un comprobante rechazado');

    return SalesReceipt.create({
      ...this.props,
      estado: ReceiptStatus.ANULADO,
    });
  }

  rechazar(): SalesReceipt {
    if (this.estado === ReceiptStatus.ANULADO)
      throw new Error('No se puede rechazar un comprobante anulado');
    if (this.estado === ReceiptStatus.RECHAZADO)
      throw new Error('El comprobante ya está rechazado');

    return SalesReceipt.create({
      ...this.props,
      estado: ReceiptStatus.RECHAZADO,
    });
  }

  isVencido(): boolean {
    return new Date() > this.fec_venc;
  }
  isMonedaSoles(): boolean {
    return this.cod_moneda === 'PEN';
  }
  isMonedaDolares(): boolean {
    return this.cod_moneda === 'USD';
  }

  getDiasHastaVencimiento(): number {
    const hoy = new Date();
    const diff = this.fec_venc.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isIGVValido(): boolean {
    const igvCalculado = Number((this.subtotal * 0.18).toFixed(2));
    return Math.abs(this.igv - igvCalculado) < 0.01;
  }

  isTotalValido(): boolean {
    const totalCalculado = Number(
      (this.subtotal + this.igv + this.isc).toFixed(2),
    );
    return Math.abs(this.total - totalCalculado) < 0.01;
  }

  validate(): void {
    if (!this.isIGVValido())
      throw new Error('El IGV no coincide con el subtotal');
    if (!this.isTotalValido())
      throw new Error('El total no coincide con la suma de los montos');
    if (this.fec_venc < this.fec_emision)
      throw new Error('La fecha de vencimiento es incorrecta');
    if (this.items.length === 0)
      throw new Error('El comprobante debe tener productos');
  }
}
