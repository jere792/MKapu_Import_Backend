import { ClaimDetail, ClaimStatus } from './claim-detail-domain-entity';

export interface ClaimProps {
  id_reclamo?: number;
  id_comprobante: number;
  id_vendedor_ref: string;
  codigo_reclamo?: string;     
  motivo: string;
  descripcion: string;
  respuesta?: string;
  estado: ClaimStatus;
  fecha_registro: Date;
  fecha_resolucion?: Date;
  id_sede?: number;
  detalles: ClaimDetail[];
}

export class Claim {
  private constructor(private readonly props: ClaimProps) {}

  static create(props: ClaimProps): Claim {
    const { id_comprobante, id_vendedor_ref, motivo, descripcion } = props;

    if (!id_comprobante) {
      throw new Error('El ID del comprobante es obligatorio');
    }

    if (!id_vendedor_ref) {
      throw new Error('El ID del vendedor es obligatorio');
    }

    if (!motivo || motivo.trim().length === 0) {
      throw new Error('El motivo del reclamo es obligatorio');
    }

    if (!descripcion || descripcion.trim().length === 0) {
      throw new Error('La descripción del reclamo es obligatoria');
    }

    return new Claim(props);
  }

static createNew(
  id_comprobante: number,
  id_vendedor_ref: string,
  motivo: string,
  descripcion: string,
  id_sede?: number,
  detalles: ClaimDetail[] = [],
): Claim {
  return Claim.create({
    id_comprobante,
    id_vendedor_ref,
    motivo,
    descripcion,
    codigo_reclamo: Claim.generarCodigo(), // 👈 agregar
    estado: ClaimStatus.REGISTRADO,
    fecha_registro: new Date(),
    id_sede,
    detalles,
  });
}

private static generarCodigo(): string {
  const now = new Date();
  const fecha = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `REC-${fecha}-${random}`;
}

  get id_reclamo(): number | undefined {
    return this.props.id_reclamo;
  }

  get id_comprobante(): number {
    return this.props.id_comprobante;
  }

  get id_vendedor_ref(): string {
    return this.props.id_vendedor_ref;
  }

  get motivo(): string {
    return this.props.motivo;
  }

  get descripcion(): string {
    return this.props.descripcion;
  }
  get respuesta(): string | undefined {
    return this.props.respuesta;
  }
  get estado(): ClaimStatus {
    return this.props.estado;
  }

  get detalles(): ClaimDetail[] {
    return this.props.detalles;
  }

  get fecha_registro(): Date {
    return this.props.fecha_registro;
  }

  get fecha_resolucion(): Date | undefined {
    return this.props.fecha_resolucion;
  }
  get id_sede(): number | undefined {
    return this.props.id_sede;
  }

  get codigo_reclamo(): string | undefined {
    return this.props.codigo_reclamo;
  }

  iniciarReclamo(): Claim {
    if (this.estado !== ClaimStatus.REGISTRADO) {
      throw new Error(
        'Solo se puede iniciar un reclamo que esté en estado REGISTRADO',
      );
    }
    return Claim.create({
      ...this.props,
      estado: ClaimStatus.EN_PROCESO,
    });
  }

  resolver(respuesta: string): Claim {
    if (this.estado !== ClaimStatus.EN_PROCESO) {
      throw new Error('Solo se puede resolver un reclamo que esté EN_PROCESO');
    }

    return Claim.create({
      ...this.props,
      estado: ClaimStatus.RESUELTO,
      respuesta: respuesta,
      fecha_resolucion: new Date(),
    });
  }

  rechazar(): Claim {
    if (this.estado === ClaimStatus.EN_PROCESO) {
      throw new Error(
        'No se puede rechazar un reclamo que esté en estado EN_PROCESO',
      );
    }

    return Claim.create({
      ...this.props,
      estado: ClaimStatus.RECHAZADO,
      fecha_resolucion: new Date(),
    });
  }

  agregarDetalle(detalle: ClaimDetail): Claim {
    const nuevosDetalles = [...this.props.detalles, detalle];

    return Claim.create({
      ...this.props,
      detalles: nuevosDetalles,
    });
  }

  isFinalizado(): boolean {
    return (
      this.estado === ClaimStatus.RESUELTO ||
      this.estado === ClaimStatus.RECHAZADO
    );
  }
}
