export interface UserResponseDto {
  id_usuario: number;
  usu_nom: string;
  ape_mat: string;
  ape_pat: string;
  nombreCompleto: string;
  dni: string;
  email: string;
  celular: string;
  direccion: string;
  genero: 'M' | 'F';
  fec_nac: Date;
  activo: boolean;
  id_sede?: number;
  sedeNombre?: string;
  rolNombre?: string;
}
