/* ============================================
   administration/src/core/user/application/dto/out/user-list-response.ts
   ============================================ */

import { UserResponseDto } from './user-response-dto';

export interface UserListResponse {
  users: UserResponseDto[];
  total: number;
  page?: number;             // Paginación opcional
  pageSize?: number;
}