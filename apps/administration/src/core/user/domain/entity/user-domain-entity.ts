/* ============================================
   administration/src/core/user/domain/entity/user-domain-entity.ts
   ============================================ */

export interface UserProps {
  // Campos de la tabla 'usuario'
  id_usuario?: number;
  usu_nom: string;
  ape_mat: string;
  ape_pat: string;
  dni: string;
  email: string;
  celular: string;
  direccion: string;
  genero: string;
  fec_nac: Date;
  activo: boolean;

  id_sede?: number;
  sedeNombre?: string;
  rolNombre?: string;
}

export class Usuario {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): Usuario {
    return new Usuario({
      ...props,
      activo: props.activo ?? true,
    });
  }

  get id_usuario() {
    return this.props.id_usuario;
  }

  get usu_nom() {
    return this.props.usu_nom;
  }

  get ape_mat() {
    return this.props.ape_mat;
  }

  get ape_pat() {
    return this.props.ape_pat;
  }

  get nombreCompleto(): string {
    return `${this.props.usu_nom} ${this.props.ape_pat} ${this.props.ape_mat}`;
  }

  get dni() {
    return this.props.dni;
  }

  get email() {
    return this.props.email;
  }

  get celular() {
    return this.props.celular;
  }

  get direccion() {
    return this.props.direccion;
  }

  get genero() {
    return this.props.genero;
  }

  get fec_nac() {
    return this.props.fec_nac;
  }

  get activo() {
    return this.props.activo;
  }

  get id_sede() {
    return this.props.id_sede;
  }

  get sedeNombre() {
    return this.props.sedeNombre;
  }
  set sedeNombre(value: string | undefined) {
    this.props.sedeNombre = value;
  }
  get rolNombre() {
    return this.props.rolNombre;
  }
  set rolNombre(value: string | undefined) {
    this.props.rolNombre = value;
  }
  // Métodos de negocio
  isActive(): boolean {
    return this.props.activo === true;
  }

  esMasculino(): boolean {
    return this.props.genero === 'M';
  }

  esFemenino(): boolean {
    return this.props.genero === 'F';
  }
}
