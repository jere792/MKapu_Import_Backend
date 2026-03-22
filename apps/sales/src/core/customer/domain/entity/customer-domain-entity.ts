export interface CustomerProps {
  id_cliente?: string;
  id_tipo_documento: number;
  valor_doc: string;
  nombres: string;
  apellidos?: string;
  razon_social?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  estado?: boolean;
  tipoDocumentoDescripcion?: string;
  tipoDocumentoCodSunat?: string;
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {
    this.validate();
  }

  static create(props: CustomerProps): Customer {
    return new Customer(props);
  }

  private validate(): void {
    if (!this.props.valor_doc?.trim()) {
      throw new Error('Document value is required');
    }
    if (!this.props.id_tipo_documento) {
      throw new Error('Document type is required');
    }

    const esRUC = this.props.tipoDocumentoCodSunat === '06';

    if (esRUC) {
      const tieneNombre =
        this.props.razon_social?.trim() || this.props.nombres?.trim();
      if (!tieneNombre) {
        throw new Error('Business name is required for RUC');
      }
    } else if (this.props.tipoDocumentoCodSunat) {
      if (!this.props.nombres?.trim()) {
        throw new Error('Name is required');
      }
    }
  }

  get id_cliente(): string | undefined {
    return this.props.id_cliente;
  }
  get id_tipo_documento(): number {
    return this.props.id_tipo_documento;
  }
  get valor_doc(): string {
    return this.props.valor_doc;
  }
  get nombres(): string {
    return this.props.nombres;
  }
  get apellidos(): string | undefined {
    return this.props.apellidos;
  }
  get razon_social(): string | undefined {
    return this.props.razon_social;
  }
  get direccion(): string | undefined {
    return this.props.direccion;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get telefono(): string | undefined {
    return this.props.telefono;
  }
  get estado(): boolean {
    return this.props.estado ?? true;
  }
  get tipoDocumentoDescripcion(): string | undefined {
    return this.props.tipoDocumentoDescripcion;
  }
  get tipoDocumentoCodSunat(): string | undefined {
    return this.props.tipoDocumentoCodSunat;
  }

  getDisplayName(): string {
    if (this.props.razon_social?.trim()) {
      return this.props.razon_social.trim();
    }
    return `${this.props.nombres} ${this.props.apellidos ?? ''}`.trim();
  }

  getInvoiceType(): 'BOLETA' | 'FACTURA' {
    return this.props.tipoDocumentoCodSunat === '06' ? 'FACTURA' : 'BOLETA';
  }
}