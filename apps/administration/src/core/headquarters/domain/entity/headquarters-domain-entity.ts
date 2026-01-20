/*  administration/src/core/headquarters/domain/entity/headquarters-domain-entity.ts */

export interface HeadquartersProps {
  id: number;
  nombre: string;
}

export class Headquarters {
  private constructor(private readonly props: HeadquartersProps) {}

  static create(props: HeadquartersProps): Headquarters {
    return new Headquarters(props);
  }

  get id() {
    return this.props.id;
  }
  get nombre() {
    return this.props.nombre;
  }
}
