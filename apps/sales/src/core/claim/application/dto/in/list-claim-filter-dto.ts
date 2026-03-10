export interface ListClaimFilterDto {
  id_vendedor_ref?: string;
  estado?: string;
  id_comprobante?: number;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  sedeId?: number;
  page?: number;
  limit?: number;
}
