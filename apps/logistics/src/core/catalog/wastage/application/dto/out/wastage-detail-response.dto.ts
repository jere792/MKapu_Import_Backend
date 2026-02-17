export class WastageDetailResponseDto {
  id_detalle!: number;
  id_producto!: number;
  cod_prod!: string;
  desc_prod!: string;
  cantidad!: number;
  pre_unit!: number;
  observacion?: string;
  id_tipo_merma?: number;
}