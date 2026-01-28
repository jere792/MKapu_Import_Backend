/* ============================================
   PORT IN - Input Ports (Application Layer)
   administration/src/core/user/domain/ports/in/user-port-in.ts
   ============================================ */

import {
  RegisterUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
  ListUserFilterDto,
} from '../../../application/dto/in';

import {
  UserResponseDto,
  UserListResponse,
  UserDeletedResponseDto,
} from '../../../application/dto/out';
import { UserWithAccountResponseDto } from '../../../application/dto/out/user-with-account-response.dto';

/**
 * Puerto de entrada para COMANDOS (Escritura)
 * Estas operaciones usan REST: POST, PUT, DELETE
 */
export interface IUserCommandPort {
  registerUser(dto: RegisterUserDto): Promise<UserResponseDto>;

  updateUser(dto: UpdateUserDto): Promise<UserResponseDto>;

  changeUserStatus(dto: ChangeUserStatusDto): Promise<UserResponseDto>;

  deleteUser(id: number): Promise<UserDeletedResponseDto>;
}

export interface IUserQueryPort {
  listUsers(filters?: ListUserFilterDto): Promise<UserListResponse>;

  getUserById(id: number): Promise<UserResponseDto | null>;

  getUserByDni(dni: string): Promise<UserResponseDto | null>;

  getUserByEmail(email: string): Promise<UserResponseDto | null>;
  getUserWithAccount(id: number): Promise<UserWithAccountResponseDto>;
}
