import { QuoteDetail } from "./quote-datail-domain-entity";

export type QuoteStatus = 'PENDIENTE' | 'APROBADA' | 'VENCIDA' | 'RECHAZADA';
export type QuoteTipo   = 'VENTA' | 'COMPRA';

export class Quote {
  public details: QuoteDetail[] = [];

  constructor(
    public readonly id_cotizacion: number | null,
    public readonly id_cliente:    string | null,  // null cuando tipo = COMPRA
    public readonly id_proveedor:  string | null,  // null cuando tipo = VENTA
    public readonly id_sede:       number,
    public subtotal:               number,
    public igv:                    number,
    public total:                  number,
    public estado:                 QuoteStatus = 'PENDIENTE',
    fec_emision:                   Date | string = new Date(),
    public fec_venc:               Date = new Date(),
    public activo:                 boolean = true,
    details:                       QuoteDetail[] = [],
    public tipo:                   QuoteTipo = 'VENTA',
  ) {
    this.details     = details;
    this.fec_emision = fec_emision instanceof Date ? fec_emision : new Date(fec_emision);
    this.fec_venc    = this.fec_venc instanceof Date ? this.fec_venc : new Date(this.fec_venc);

    this.validarMontos();
    this.validarFechas();
    this.validarEstadoInicial();
    this.validarTipo();
    this.validarSede();
    this.validarParticipante();   // ← nueva validación
  }

  public readonly fec_emision: Date;

  // ── Lógica de negocio ─────────────────────────────────────────────────────

  aprobar(): void {
    if (this.estaVencida())          throw new Error('No se puede aprobar una cotización vencida');
    if (this.estado === 'APROBADA')  throw new Error('La cotización ya fue aprobada');
    if (this.estado === 'RECHAZADA') throw new Error('No se puede aprobar una cotización rechazada');
    if (!this.activo)                throw new Error('No se puede aprobar una cotización inactiva');
    this.estado = 'APROBADA';
  }

  rechazar(): void {
    if (this.estado === 'RECHAZADA') throw new Error('La cotización ya fue rechazada');
    if (this.estado === 'APROBADA')  throw new Error('No se puede rechazar una cotización ya aprobada');
    this.estado = 'RECHAZADA';
  }

  vencer(): void {
    if (!this.estaVencida()) throw new Error('Solo cotizaciones expiradas pueden marcarse como vencidas');
    this.estado = 'VENCIDA';
  }

  cambiarEstado(nuevoEstado: QuoteStatus): void {
    const ESTADOS_VALIDOS: QuoteStatus[] = ['PENDIENTE', 'APROBADA', 'VENCIDA', 'RECHAZADA'];
    if (!ESTADOS_VALIDOS.includes(nuevoEstado))
      throw new Error(`Estado inválido: ${nuevoEstado}`);
    this.estado = nuevoEstado;
  }

  // ── Helpers de tipo ───────────────────────────────────────────────────────
  esVenta():  boolean { return this.tipo === 'VENTA';  }
  esCompra(): boolean { return this.tipo === 'COMPRA'; }

  // ── Helpers de estado ─────────────────────────────────────────────────────
  estaVencida(): boolean { return new Date() > this.fec_venc;      }
  esAprobada():  boolean { return this.estado === 'APROBADA';       }
  esPendiente(): boolean { return this.estado === 'PENDIENTE';      }
  esVencida():   boolean { return this.estado === 'VENCIDA';        }
  esRechazada(): boolean { return this.estado === 'RECHAZADA';      }

  // ── Validaciones ──────────────────────────────────────────────────────────
  private validarMontos(): void {
    if (this.subtotal < 0) throw new Error('El subtotal no puede ser negativo');
    if (this.igv < 0)      throw new Error('El IGV no puede ser negativo');
    if (this.total < 0)    throw new Error('El total no puede ser negativo');
    if (Math.abs((this.subtotal + this.igv) - this.total) > 0.01)
      throw new Error('La suma de subtotal e IGV debe ser igual al total');
  }

  private validarFechas(): void {
    if (this.fec_emision > this.fec_venc)
      throw new Error('La fecha de emisión no puede ser mayor a la fecha de vencimiento');
  }

  private validarEstadoInicial(): void {
    if (!['PENDIENTE', 'APROBADA', 'VENCIDA', 'RECHAZADA'].includes(this.estado))
      throw new Error('Estado de cotización no válido');
  }

  private validarTipo(): void {
    if (!['VENTA', 'COMPRA'].includes(this.tipo))
      throw new Error('Tipo de cotización no válido. Use VENTA o COMPRA');
  }

  private validarSede(): void {
    if (!this.id_sede || typeof this.id_sede !== 'number' || this.id_sede <= 0)
      throw new Error('La sede debe ser un número válido y mayor que cero');
  }

  private validarParticipante(): void {
    if (this.tipo === 'VENTA' && !this.id_cliente)
      throw new Error('Una cotización de VENTA debe tener un cliente');
    if (this.tipo === 'COMPRA' && !this.id_proveedor)
      throw new Error('Una cotización de COMPRA debe tener un proveedor');
  }

  // ── Activar / desactivar ──────────────────────────────────────────────────
  desactivar(): void { this.activo = false; }
  activar():    void { this.activo = true;  }

  setMontos(subtotal: number, igv: number, total: number): void {
    if (!this.esPendiente()) throw new Error('Solo puede modificar montos en estado PENDIENTE');
    this.subtotal = subtotal;
    this.igv      = igv;
    this.total    = total;
    this.validarMontos();
  }

  setFechaVencimiento(nuevaFecha: Date): void {
    if (!this.esPendiente()) throw new Error('Solo puede cambiar la fecha de vencimiento en estado PENDIENTE');
    this.fec_venc = nuevaFecha;
    this.validarFechas();
  }
}