export class Cashbox {
  constructor(
    public readonly id_caja: string,
    public readonly id_sede_ref: number,
    public estado: 'ABIERTA' | 'CERRADA',
    public readonly fec_apertura: Date,
    public fec_cierre?: Date | null,
    public monto_inicial?: number | null, 
  ) {}

  cerrarCaja(): void {
    if (this.estado === 'CERRADA') throw new Error('La caja ya se encuentra cerrada.');
    this.estado = 'CERRADA';
    this.fec_cierre = new Date();
  }
}