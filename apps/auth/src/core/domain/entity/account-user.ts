/* auth/src/core/domain/entity/account-user.ts */
import { Usuario } from 'apps/administration/src/core/user/domain/entity/user-domain-entity';
import { Role } from 'apps/administration/src/core/role/domain/entity/role-domain-entity';
import { Headquarters } from 'apps/administration/src/core/headquarters/domain/entity/headquarters-domain-entity';

export interface AccountUserProps {
  id?: number;
  nombreUsuario: string;
  contrasenia: string;
  email: string;
  estado?: boolean;
  rolNombre: string;

  usuario?: Usuario;
  roles?: Role[];
  sede?: Headquarters;
}

export class AccountUser {
  private constructor(private readonly props: AccountUserProps) {}

  static create(props: AccountUserProps): AccountUser {
    return new AccountUser({
      ...props,
      estado: props.estado ?? true,
    });
  }

  get id() {
    return this.props.id;
  }
  get nombreUsuario() {
    return this.props.nombreUsuario;
  }
  get contrasenia() {
    return this.props.contrasenia;
  }
  get email() {
    return this.props.email;
  }
  get estado() {
    return this.props.estado;
  }
  get rolNombre() {
    return this.props.rolNombre;
  }

  isActive(): boolean {
    return this.props.estado === true;
  }
  get nombreCompletoPersona(): string {
    return this.props.usuario ? this.props.usuario.nombreCompleto : '';
  }

  tieneRol(nombreRol: string): boolean {
    return this.props.roles?.some((r) => r.nombre === nombreRol) ?? false;
  }
}
