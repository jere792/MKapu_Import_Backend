// src/commission/domain/entity/commission-domain-entity.ts
// Agrega los getters que faltaban: porcentaje e id_regla

export enum CommissionStatus {
  PENDIENTE = 'PENDIENTE',
  LIQUIDADA = 'LIQUIDADA',
  ANULADA   = 'ANULADA',
}

export interface CommissionProps {
  id_comision?:       number;
  id_vendedor_ref:    string;
  id_comprobante:     number;
  porcentaje:         number;
  monto:              number;
  estado:             CommissionStatus;
  fecha_registro:     Date;
  fecha_liquidacion?: Date;
  id_regla?:          number;
}

export class Commission {
  private constructor(private readonly props: CommissionProps) {}

  static create(props: CommissionProps): Commission {
    const { id_vendedor_ref, id_comprobante, porcentaje, monto } = props;

    if (!id_vendedor_ref)
      throw new Error('El ID del vendedor es obligatorio');
    if (!id_comprobante)
      throw new Error('El ID del comprobante es obligatorio');
    if (porcentaje <= 0 || porcentaje > 100)
      throw new Error('El porcentaje de comisión es inválido');
    if (monto < 0)
      throw new Error('El monto de comisión no puede ser negativo');

    return new Commission(props);
  }

  static generar(
    id_vendedor_ref: string,
    id_comprobante:  number,
    porcentaje:      number,
    totalVenta:      number,
    id_regla?:       number,
  ): Commission {
    const monto = +(totalVenta * (porcentaje / 100)).toFixed(2);
    return Commission.create({
      id_vendedor_ref,
      id_comprobante,
      porcentaje,
      monto,
      estado:          CommissionStatus.PENDIENTE,
      fecha_registro:  new Date(),
      id_regla,
    });
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id_comision(): number | undefined  { return this.props.id_comision; }
  get id_vendedor_ref(): string          { return this.props.id_vendedor_ref; }
  get id_comprobante(): number           { return this.props.id_comprobante; }
  get porcentaje(): number               { return this.props.porcentaje; }   // ← nuevo
  get monto(): number                    { return this.props.monto; }
  get estado(): CommissionStatus         { return this.props.estado; }
  get fecha_registro(): Date             { return this.props.fecha_registro; }
  get fecha_liquidacion(): Date | undefined { return this.props.fecha_liquidacion; }
  get id_regla(): number | undefined     { return this.props.id_regla; }     // ← nuevo

  // ── Transiciones de estado ───────────────────────────────────────────────

  liquidar(): Commission {
    if (this.props.estado !== CommissionStatus.PENDIENTE)
      throw new Error('Solo se pueden liquidar comisiones pendientes');

    return new Commission({
      ...this.props,
      estado:            CommissionStatus.LIQUIDADA,
      fecha_liquidacion: new Date(),
    });
  }

  anular(): Commission {
    if (this.props.estado === CommissionStatus.ANULADA)
      throw new Error('La comisión ya está anulada');

    return new Commission({
      ...this.props,
      estado: CommissionStatus.ANULADA,
    });
  }

  isPendiente(): boolean {
    return this.estado === CommissionStatus.PENDIENTE;
  }
}