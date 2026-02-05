/* sales/src/core/checkout/domain/entity/checkout-domain-entity.ts */
/* ============================================
   administration/src/core/cashbox/domain/entities/cashbox.entity.ts
   ============================================ */

export class Cashbox {
  constructor(
    public readonly id_caja: string,
    public readonly id_sede_ref: number,
    public estado: 'ABIERTA' | 'CERRADA',
    public readonly fec_apertura: Date,
    public fec_cierre?: Date | null,
  ) {}

  // Método de negocio para validar el cierre
  cerrarCaja(): void {
    if (this.estado === 'CERRADA') {
      throw new Error('La caja ya se encuentra cerrada.');
    }
    this.estado = 'CERRADA';
    this.fec_cierre = new Date();
  }
}
