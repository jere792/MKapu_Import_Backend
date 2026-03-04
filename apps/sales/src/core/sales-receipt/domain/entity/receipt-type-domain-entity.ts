/* ============================================
   sales/src/core/salesreceipt/domain/entity/receipt-type.ts
   ============================================ */

export interface ReceiptTypeProps {
  id_tipo_comprobante?: number; 
  cod_sunat: string; 
  descripcion: string;
  estado: boolean;
}

export class ReceiptType {
  private constructor(private readonly props: ReceiptTypeProps) {}

  static create(props: ReceiptTypeProps): ReceiptType {
    // Validación: cod_sunat debe ser exactamente 2 caracteres
    if (props.cod_sunat.length !== 2) {
      throw new Error('El código SUNAT debe tener exactamente 2 caracteres');
    }
    return new ReceiptType(props);
  }

  static createNew(
    cod_sunat: string,
    descripcion: string,
    estado: boolean = true,
  ): ReceiptType {
    return ReceiptType.create({
      cod_sunat,
      descripcion,
      estado,
    });
  }

  get id_tipo_comprobante(): number | undefined {
    return this.props.id_tipo_comprobante;
  }

  get cod_sunat(): string {
    return this.props.cod_sunat;
  }

  get descripcion(): string {
    return this.props.descripcion;
  }

  get estado(): boolean {
    return this.props.estado;
  }

  // Métodos de utilidad
  isActive(): boolean {
    return this.estado === true;
  }

  isFactura(): boolean {
    return this.cod_sunat === '01'; //factura 
  }

  isBoleta(): boolean {
    return this.cod_sunat === '03'; //boleta
  }

  isNotaCredito(): boolean {
    return this.cod_sunat === '07'; // nota de credito 
  }

  isNotaDebito(): boolean {
    return this.cod_sunat === '08'; // nota de debito
  }

  // Activar/Desactivar
  activate(): ReceiptType {
    return ReceiptType.create({
      ...this.props,
      estado: true,
    });
  }

  deactivate(): ReceiptType {
    return ReceiptType.create({
      ...this.props,
      estado: false,
    });
  }
}