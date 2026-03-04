/* ============================================
   sales/src/core/salesreceipt/domain/entity/sales-type.ts
   ============================================ */

export enum SalesTypeEnum {
  PRESENCIAL = 'PRESENCIAL',
  DELIVERY = 'DELIVERY',
  RECOJO_TIENDA = 'RECOJO_TIENDA',
  ENVIO_PROVINCIA = 'ENVIO_PROVINCIA',
}

export interface SalesTypeProps {
  id_tipo_venta?: number;
  tipo: SalesTypeEnum;
  descripcion: string;
}

export class SalesType {
  private constructor(private readonly props: SalesTypeProps) {}

  static create(props: SalesTypeProps): SalesType {
    return new SalesType(props);
  }

  static createNew(tipo: SalesTypeEnum, descripcion: string): SalesType {
    return new SalesType({
      tipo,
      descripcion,
    });
  }

  get id_tipo_venta(): number | undefined {
    return this.props.id_tipo_venta;
  }

  get tipo(): SalesTypeEnum {
    return this.props.tipo;
  }

  get descripcion(): string {
    return this.props.descripcion;
  }

  // Métodos de utilidad
  isPresencial(): boolean {
    return this.tipo === SalesTypeEnum.PRESENCIAL;
  }

  isDelivery(): boolean {
    return this.tipo === SalesTypeEnum.DELIVERY;
  }

  isRecojoTienda(): boolean {
    return this.tipo === SalesTypeEnum.RECOJO_TIENDA;
  }

  isEnvioProvincia(): boolean {
    return this.tipo === SalesTypeEnum.ENVIO_PROVINCIA;
  }
}