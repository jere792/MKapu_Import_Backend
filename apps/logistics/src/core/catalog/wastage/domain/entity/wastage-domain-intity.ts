/* .../wastage/domain/entity/wastage-domain-intity.ts */
export class Wastage {
constructor(
    public readonly id_merma: number | null,
    public readonly id_usuario_ref: number,
    public readonly id_sede_ref: number,   
    public readonly id_almacen_ref: number,
    public readonly motivo: string,
    public readonly fec_merma: Date,
    public readonly estado: boolean,
    public readonly detalles: WastageDetail[]
  ) {}
}

export class WastageDetail {
  constructor(
    public id_detalle: number | null,
    public id_producto: number,
    public cod_prod: string,
    public desc_prod: string,
    public cantidad: number,
    public pre_unit: number,
    public id_tipo_merma: number,
    public observacion?: string
  ) {}
}