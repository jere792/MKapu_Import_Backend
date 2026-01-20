/* ============================================
   administration/src/core/user/application/service/user-command.service.ts
   ============================================ */

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserCommandPort } from '../../domain/ports/in/user-port-in';
import { IUserRepositoryPort } from '../../domain/ports/out/user-port-out';
import {
  RegisterUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
} from '../dto/in';
import {
  UserResponseDto,
  UserDeletedResponseDto,
} from '../dto/out';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class UserCommandService implements IUserCommandPort {
  constructor(
    @Inject('IUserRepositoryPort')
    private readonly repository: IUserRepositoryPort,
  ) {}

  /**
   * POST - Registrar nuevo usuario
   */
  async registerUser(dto: RegisterUserDto): Promise<UserResponseDto> {
    // Validar que no exista el DNI
    const existsByDni = await this.repository.existsByDni(dto.dni);
    if (existsByDni) {
      throw new ConflictException('Ya existe un usuario con ese DNI');
    }

    // Validar que no exista el email
    const existsByEmail = await this.repository.existsByEmail(dto.email);
    if (existsByEmail) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Convertir DTO a Entidad de Dominio
    const usuario = UserMapper.fromRegisterDto(dto);

    // Guardar en repositorio
    const savedUser = await this.repository.save(usuario);

    // Convertir Entidad a DTO de respuesta
    return UserMapper.toResponseDto(savedUser);
  }

  /**
   * PUT - Actualizar usuario
   */
  async updateUser(dto: UpdateUserDto): Promise<UserResponseDto> {
    // Buscar usuario existente
    const existingUser = await this.repository.findById(dto.id_usuario);
    if (!existingUser) {
      throw new NotFoundException(
        `Usuario con ID ${dto.id_usuario} no encontrado`,
      );
    }

    // Si se quiere cambiar el email, validar que no esté en uso
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.repository.existsByEmail(dto.email);
      if (emailExists) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    // Actualizar entidad con nuevos datos
    const updatedUser = UserMapper.fromUpdateDto(existingUser, dto);

    // Guardar cambios
    const savedUser = await this.repository.update(updatedUser);

    // Retornar DTO de respuesta
    return UserMapper.toResponseDto(savedUser);
  }

  /**
   * PUT - Cambiar estado del usuario (activar/desactivar)
   */
  async changeUserStatus(dto: ChangeUserStatusDto): Promise<UserResponseDto> {
    // Buscar usuario existente
    const existingUser = await this.repository.findById(dto.id_usuario);
    if (!existingUser) {
      throw new NotFoundException(
        `Usuario con ID ${dto.id_usuario} no encontrado`,
      );
    }

    // Actualizar estado
    const updatedUser = UserMapper.withStatus(existingUser, dto.activo);

    // Guardar cambios
    const savedUser = await this.repository.update(updatedUser);

    // Retornar DTO de respuesta
    return UserMapper.toResponseDto(savedUser);
  }

  /**
   * DELETE - Eliminar usuario
   */
  async deleteUser(id: number): Promise<UserDeletedResponseDto> {
    // Verificar que el usuario existe
    const existingUser = await this.repository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Eliminar del repositorio
    await this.repository.delete(id);

    // Retornar confirmación
    return UserMapper.toDeletedResponse(id);
  }
}