/* ============================================
   administration/src/core/user/application/dto/in/list-user-filter-dto.ts
   ============================================ */

export interface ListUserFilterDto {
  activo?: boolean; // Filtrar por estado
  search?: string; // Búsqueda por nombre, DNI, email
  id_sede?: number; // Filtrar por sede
  genero?: 'M' | 'F'; // Filtrar por género
}
