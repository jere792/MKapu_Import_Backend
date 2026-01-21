/* ============================================
   administration/src/core/user/application/dto/in/update-user-dto.ts
   ============================================ */

export interface UpdateUserDto {
  id_usuario: number;
  usu_nom?: string;
  ape_mat?: string;
  ape_pat?: string;
  email?: string;
  celular?: string;
  direccion?: string;
  genero?: 'M' | 'F';
  fec_nac?: Date;
  id_sede?: number;
}
