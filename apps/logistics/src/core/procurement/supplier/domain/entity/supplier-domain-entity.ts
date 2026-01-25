/* ============================================
   DOMAIN LAYER - SUPPLIER
   logistics/src/core/procurement/supplier/domain/entity/supplier-domain-entity.ts
   ============================================ */

export interface SupplierProps {
  id_proveedor?: number;
  razon_social: string;
  ruc: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  dir_fiscal?: string;
  estado?: boolean;
}

export class Supplier {
  private constructor(private readonly props: SupplierProps) {}

  static create(props: SupplierProps): Supplier {
    return new Supplier({
      ...props,
      estado: props.estado ?? true,
    });
  }

  get id_proveedor() {
    return this.props.id_proveedor;
  }

  get razon_social() {
    return this.props.razon_social;
  }

  get ruc() {
    return this.props.ruc;
  }

  get contacto() {
    return this.props.contacto;
  }

  get email() {
    return this.props.email;
  }

  get telefono() {
    return this.props.telefono;
  }

  get dir_fiscal() {
    return this.props.dir_fiscal;
  }

  get estado() {
    return this.props.estado;
  }

  // Métodos de negocio
  isActive(): boolean {
    return this.props.estado === true;
  }

  hasCompleteContactInfo(): boolean {
    return !!(this.props.contacto && this.props.email && this.props.telefono);
  }

  isValidRuc(): boolean {
    return this.props.ruc.length === 11 && /^\d+$/.test(this.props.ruc);
  }
}