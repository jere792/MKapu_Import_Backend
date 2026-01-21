/* ============================================
   administration/src/core/user/application/dto/in/register-user-dto.ts
   ============================================ */

export interface RegisterUserDto {
  usu_nom: string; // Nombre (VARCHAR 50)
  ape_mat: string; // Apellido materno (VARCHAR 50)
  ape_pat: string; // Apellido paterno (VARCHAR 50)
  dni: string; // DNI (VARCHAR 8)
  email: string; // Email (VARCHAR 150)
  celular: string; // Celular (VARCHAR 9)
  direccion: string; // Dirección (VARCHAR 100)
  genero: 'M' | 'F'; // Género (CHAR 1)
  fec_nac: Date; // Fecha de nacimiento
  id_sede?: number; // ID de sede (opcional)
}
