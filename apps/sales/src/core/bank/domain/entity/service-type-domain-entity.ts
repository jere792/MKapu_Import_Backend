export interface ServiceTypeProps {
  id_servicio?: number;
  id_banco: number;
  nombre_servicio: string;
  descripcion?: string;
}

export class ServiceType {
  private constructor(private readonly props: ServiceTypeProps) {}

  static create(props: ServiceTypeProps): ServiceType {
    if (!props.nombre_servicio || props.nombre_servicio.trim().length === 0)
      throw new Error('El nombre del servicio es obligatorio');
    if (!props.id_banco)
      throw new Error('El banco es obligatorio');
    return new ServiceType(props);
  }

  get id_servicio(): number | undefined { return this.props.id_servicio; }
  get id_banco(): number                { return this.props.id_banco; }
  get nombre_servicio(): string         { return this.props.nombre_servicio; }
  get descripcion(): string | undefined { return this.props.descripcion; }
}