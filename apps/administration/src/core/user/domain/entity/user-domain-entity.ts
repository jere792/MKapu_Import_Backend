/* ============================================
   administration/src/core/user/domain/entity/user-domain-entity.ts
   ============================================ */

export interface UserProps {
  // Campos de la tabla 'usuario'
  id_usuario?: number;
  usu_nom: string;           // nombre del usuario
  ape_mat: string;           // apellido materno
  ape_pat: string;           // apellido paterno
  dni: string;               // DNI (8 caracteres)
  email: string;             // email (150)
  celular: string;           // celular (9)
  direccion: string;         // dirección (100)
  genero: string;            // género (1 char: M/F)
  fec_nac: Date;             // fecha de nacimiento
  activo: boolean;           // TINYINT (1/0)
  
  // Relación con sede
  id_sede?: number;
  sedeNombre?: string;       // Para consultas (no se persiste)
}

export class Usuario {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): Usuario {
    return new Usuario({
      ...props,
      activo: props.activo ?? true,
    });
  }

  // Getters para tabla 'usuario'
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