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
  get id_tipo_venta(): number | undefined {
    return this.props.id_tipo_venta;
  }
  get tipo(): SalesTypeEnum {
    return this.props.tipo;
  }
  get descripcion(): string {
    return this.props.descripcion;
  }
}
