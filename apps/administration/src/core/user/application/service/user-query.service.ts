/* ============================================
   administration/src/core/user/application/service/user-query.service.ts
   ============================================ */

import { Inject, Injectable } from '@nestjs/common';
import { IUserQueryPort } from '../../domain/ports/in/user-port-in';
import { IUserRepositoryPort } from '../../domain/ports/out/user-port-out';
import { ListUserFilterDto } from '../dto/in';
import { UserResponseDto, UserListResponse } from '../dto/out';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class UserQueryService implements IUserQueryPort {
  constructor(
    @Inject('IUserRepositoryPort')
    private readonly repository: IUserRepositoryPort,
  ) {}

  /**
   * WebSocket - Listar todos los usuarios
   */
  async listUsers(filters?: ListUserFilterDto): Promise<UserListResponse> {
    const usuarios = await this.repository.findAll(filters);
    return UserMapper.toListResponse(usuarios);
  }

  /**
   * WebSocket - Obtener usuario por ID
   */
  async getUserById(id: number): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findById(id);

    if (!usuario) {
      return null;
    }

    return UserMapper.toResponseDto(usuario);
  }

  /**
   * WebSocket - Buscar usuario por DNI
   */
  async getUserByDni(dni: string): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findByDni(dni);

    if (!usuario) {
      return null;
    }

    return UserMapper.toResponseDto(usuario);
  }

  /**
   * WebSocket - Buscar usuario por Email
   */
  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findByEmail(email);

    if (!usuario) {
      return null;
    }

    return UserMapper.toResponseDto(usuario);
  }
}