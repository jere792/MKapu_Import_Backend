/* ============================================
   administration/src/core/sede-almacen/domain/entity/sede-almacen-domain-entity.ts
   ============================================ */

export interface SedeAlmacenProps {
  id_sede: number;
  id_almacen: number;
}

export class SedeAlmacen {
  private constructor(private readonly props: SedeAlmacenProps) {}

  static create(props: SedeAlmacenProps): SedeAlmacen {
    return new SedeAlmacen({
      id_sede: Number(props.id_sede),
      id_almacen: Number(props.id_almacen),
    });
  }

  get id_sede(): number {
    return this.props.id_sede;
  }

  get id_almacen(): number {
    return this.props.id_almacen;
  }
}