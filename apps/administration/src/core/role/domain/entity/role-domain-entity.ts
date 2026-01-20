/*  administration/src/core/role/domain/entity/role-domain-entity.ts */
export interface RoleProps {
  id?: number;
  nombre: string;
}

export class Role {
  private constructor(private readonly props: RoleProps) {}

  static create(props: RoleProps): Role {
    return new Role(props);
  }

  get id() {
    return this.props.id;
  }
  get nombre() {
    return this.props.nombre;
  }

  isAdmin(): boolean {
    return (
      this.props.nombre.toUpperCase() === 'ADMIN' ||
      this.props.nombre.toUpperCase() === 'ADMINISTRADOR'
    );
  }
}
