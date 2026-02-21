export class RemissionCreatedEvent {
  constructor(
    public readonly payload: {
      remissionId: string;
      warehouseId: number;
      items: ReadonlyArray<{ id_producto: number; cantidad: number }>;
      refId: number;
      serie_numero: string;
    },
  ) {}
}
