export class CashboxResponseDto {
  id_caja: string;
  id_sede_ref: number;
  estado: string;
  fec_apertura: Date;
  fec_cierre?: Date | null;
}