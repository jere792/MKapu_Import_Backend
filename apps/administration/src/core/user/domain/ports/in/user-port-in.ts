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

/**
 * Puerto de entrada para COMANDOS (Escritura)
 * Estas operaciones usan REST: POST, PUT, DELETE
 */
export interface IUserCommandPort {
  /**
   * POST - Registrar nuevo usuario/empleado
   * @param dto - Datos del nuevo usuario
   * @returns Usuario creado
   */
  registerUser(dto: RegisterUserDto): Promise<UserResponseDto>;

  /**
   * PUT - Actualizar datos de usuario
   * @param dto - Datos a actualizar
   * @returns Usuario actualizado
   */
  updateUser(dto: UpdateUserDto): Promise<UserResponseDto>;

  /**
   * PUT - Cambiar estado activo/inactivo del usuario
   * @param dto - ID y nuevo estado
   * @returns Usuario con estado actualizado
   */
  changeUserStatus(dto: ChangeUserStatusDto): Promise<UserResponseDto>;

  /**
   * DELETE - Eliminar usuario por ID
   * @param id - ID del usuario a eliminar
   * @returns Confirmación de eliminación
   */
  deleteUser(id: number): Promise<UserDeletedResponseDto>;
}

/**
 * Puerto de entrada para CONSULTAS (Lectura)
 * Estas operaciones usan WebSockets para comunicación en tiempo real
 */
export interface IUserQueryPort {
  /**
   * WebSocket - Listar todos los usuarios
   * @param filters - Filtros opcionales (activo, búsqueda)
   * @returns Lista de usuarios con total
   */
  listUsers(filters?: ListUserFilterDto): Promise<UserListResponse>;

  /**
   * WebSocket - Obtener usuario por ID
   * @param id - ID del usuario
   * @returns Usuario encontrado o null
   */
  getUserById(id: number): Promise<UserResponseDto | null>;

  /**
   * WebSocket - Buscar usuario por DNI
   * @param dni - DNI del usuario
   * @returns Usuario encontrado o null
   */
  getUserByDni(dni: string): Promise<UserResponseDto | null>;

  /**
   * WebSocket - Buscar usuario por Email
   * @param email - Email del usuario
   * @returns Usuario encontrado o null
   */
  getUserByEmail(email: string): Promise<UserResponseDto | null>;
}
