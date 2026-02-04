export type QuoteStatus = 'PENDIENTE' | 'APROBADA' | 'VENCIDA';

export class Quote {
  constructor(
    public readonly id_cotizacion: number | null, // null si es nueva
    public readonly id_cliente: string,
    public readonly subtotal: number,
    public readonly igv: number,
    public readonly total: number,
    public estado: QuoteStatus = 'PENDIENTE',
    public readonly fec_emision: Date = new Date(),
    public readonly fec_venc: Date = new Date(),
    public activo: boolean = true
  ) {}

  // Lógica de negocio: Aprobar cotización
  aprobar(): void {
    if (this.estado === 'VENCIDA') {
      throw new Error('No se puede aprobar una cotización vencida');
    }
    this.estado = 'APROBADA';
  }

  estaVencida(): boolean {
    return new Date() > this.fec_venc;
  }
}