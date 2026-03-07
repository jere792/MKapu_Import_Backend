/* ============================================
   administration/src/core/permission/domain/ports/in/permission-port-in.ts
   ============================================ */

import {
  RegisterPermissionDto,
  UpdatePermissionDto,
  ChangePermissionStatusDto,
  ListPermissionFilterDto,
} from '../../../application/dto/in';

import {
  PermissionResponseDto,
  PermissionListResponse,
  PermissionDeletedResponseDto,
} from '../../../application/dto/out';

// Command Port (REST - POST, PUT, DELETE)
export interface IPermissionCommandPort {
  registerPermission(dto: RegisterPermissionDto): Promise<PermissionResponseDto>;
  updatePermission(dto: UpdatePermissionDto): Promise<PermissionResponseDto>;
  changePermissionStatus(dto: ChangePermissionStatusDto): Promise<PermissionResponseDto>;
  deletePermission(id: number): Promise<PermissionDeletedResponseDto>;
  
}

// Query Port (WebSockets - GET)
export interface IPermissionQueryPort {
  listPermissions(filters?: ListPermissionFilterDto): Promise<PermissionResponseDto[]>;
  getPermissionById(id: number): Promise<PermissionResponseDto | null>;
  getPermissionByName(nombre: string): Promise<PermissionResponseDto | null>;
  
}
