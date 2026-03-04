export enum DispatchDetailStatus {
  PENDIENTE = 'PENDIENTE',
  PREPARADO = 'PREPARADO',
  DESPACHADO = 'DESPACHADO',
  FALTANTE = 'FALTANTE',
}

export class DispatchDetail {
  constructor(
    public readonly id_detalle_despacho: number | null,
    public readonly id_despacho: number,         
    public readonly id_producto: number,
    public cantidad_solicitada: number,
    public cantidad_despachada: number,
    public estado: DispatchDetailStatus,
  ) {
    
  }
    static create(props: {
        id_detalle_despacho?: number;
        id_despacho?: number;
        id_producto: number;
        cantidad_solicitada: number;
        cantidad_despachada?: number;
    }): DispatchDetail {
        if (!props.id_producto)
        throw new Error('El producto es obligatorio');
        if (props.cantidad_solicitada <= 0)
        throw new Error('La cantidad solicitada debe ser mayor a 0');

        return new DispatchDetail(
        props.id_detalle_despacho ?? null,
        props.id_despacho ?? 0,
        props.id_producto,
        props.cantidad_solicitada,
        props.cantidad_despachada ?? 0,
        DispatchDetailStatus.PENDIENTE,
        );
    }


    marcarPreparado(cantidadDespachada: number): void {
        if (this.estado !== DispatchDetailStatus.PENDIENTE)
        throw new Error('Solo se pueden preparar detalles en estado PENDIENTE');
        if (cantidadDespachada < 0)
        throw new Error('La cantidad despachada no puede ser negativa');

        this.cantidad_despachada = cantidadDespachada;
        this.estado = cantidadDespachada >= this.cantidad_solicitada
        ? DispatchDetailStatus.PREPARADO
        : DispatchDetailStatus.FALTANTE;
    }

    marcarDespachado(): void {
        if (this.estado !== DispatchDetailStatus.PREPARADO)
        throw new Error('Solo se pueden despachar detalles en estado PREPARADO');
        this.estado = DispatchDetailStatus.DESPACHADO;
    }

    get tieneFaltante(): boolean {
        return this.cantidad_despachada < this.cantidad_solicitada;
    }
}
