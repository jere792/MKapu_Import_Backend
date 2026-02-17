/* ============================================
   administration/src/core/user/application/dto/in/list-user-filter-dto.ts
   ============================================ */

export interface ListUserFilterDto {
  activo?: boolean;
  search?: string; 
  id_sede?: number; 
  genero?: 'M' | 'F'; 
}
