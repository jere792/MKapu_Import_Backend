export enum CommissionTargetType {
  PRODUCTO = 'PRODUCTO',
  CATEGORIA = 'CATEGORIA',
}

export enum CommissionRewardType {
  PORCENTAJE = 'PORCENTAJE',
  MONTO_FIJO = 'MONTO_FIJO',
}

export interface CommissionRuleProps {
  id_regla?: number;
  nombre: string;
  descripcion?: string;
  tipo_objetivo: CommissionTargetType;
  id_objetivo: number;
  meta_unidades: number;
  tipo_recompensa: CommissionRewardType;
  valor_recompensa: number;
  activo: boolean;
  fecha_inicio: Date;
  fecha_fin?: Date;
}

export class CommissionRule {
  constructor(private readonly props: CommissionRuleProps) {}

  static create(props: CommissionRuleProps): CommissionRule {
    if (props.meta_unidades < 1) {
      throw new Error('La meta de unidades debe ser al menos 1');
    }

    if (props.valor_recompensa <= 0) {
      throw new Error('El valor de la comisión debe ser mayor a 0');
    }

    if (
      props.tipo_recompensa === CommissionRewardType.PORCENTAJE &&
      props.valor_recompensa > 100
    ) {
      throw new Error('El porcentaje de comisión no puede superar el 100%');
    }

    if (props.fecha_fin && props.fecha_inicio > props.fecha_fin) {
      throw new Error(
        'La fecha de inicio no puede ser posterior a la fecha fin',
      );
    }

    return new CommissionRule({
      ...props,
      activo: props.activo ?? true,
      fecha_inicio: props.fecha_inicio ?? new Date(),
    });
  }

  get id_regla(): number | undefined {
    return this.props.id_regla;
  }
  get nombre(): string {
    return this.props.nombre;
  }
  get descripcion(): string | undefined {
    return this.props.descripcion;
  }
  get tipo_objetivo(): CommissionTargetType {
    return this.props.tipo_objetivo;
  }
  get id_objetivo(): number {
    return this.props.id_objetivo;
  }
  get meta_unidades(): number {
    return this.props.meta_unidades;
  }
  get tipo_recompensa(): CommissionRewardType {
    return this.props.tipo_recompensa;
  }
  get valor_recompensa(): number {
    return this.props.valor_recompensa;
  }
  get fecha_inicio(): Date {
    return this.props.fecha_inicio;
  }
  get fecha_fin(): Date | undefined {
    return this.props.fecha_fin;
  }
  get activo(): boolean {
    return this.props.activo;
  }
  esVigente(fecha: Date = new Date()): boolean {
    if (!this.activo) return false;
    if (fecha < this.fecha_inicio) return false;
    if (this.fecha_fin && fecha > this.fecha_fin) return false;
    return true;
  }

  calcularComision(precioUnitario: number): number {
    if (this.tipo_recompensa === CommissionRewardType.MONTO_FIJO) {
      return this.valor_recompensa;
    }
    return precioUnitario * (this.valor_recompensa / 100);
  }

  desactivar(): void {
    this.props.activo = false;
  }
}
