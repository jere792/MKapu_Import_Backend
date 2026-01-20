/* ============================================
   administration/src/core/user/application/mapper/user.mapper.ts
   ============================================ */

import { Usuario } from '../../domain/entity/user-domain-entity';
import { RegisterUserDto, UpdateUserDto } from '../dto/in';
import {
  UserResponseDto,
  UserListResponse,
  UserDeletedResponseDto,
} from '../dto/out';

/**
 * Mapper para convertir entre Entidades de Dominio y DTOs
 */
export class UserMapper {
  /**
   * Convierte una Entidad de Dominio (Usuario) a un DTO de respuesta
   */
  static toResponseDto(usuario: Usuario): UserResponseDto {
    return {
      id_usuario: usuario.id_usuario!,
      usu_nom: usuario.usu_nom,
      ape_mat: usuario.ape_mat,
      ape_pat: usuario.ape_pat,
      nombreCompleto: usuario.nombreCompleto,
      dni: usuario.dni,
      email: usuario.email,
      celular: usuario.celular,
      direccion: usuario.direccion,
      genero: usuario.genero as "M" | "F",
      fec_nac: usuario.fec_nac,
      activo: usuario.activo,
      id_sede: usuario.id_sede,
      sedeNombre: usuario.sedeNombre,
    };
  }

  /**
   * Convierte un array de Entidades a una respuesta de lista
   */
  static toListResponse(usuarios: Usuario[]): UserListResponse {
    return {
      users: usuarios.map((user) => this.toResponseDto(user)),
      total: usuarios.length,
    };
  }

  /**
   * Convierte un RegisterUserDto a una Entidad de Dominio
   */
  static fromRegisterDto(dto: RegisterUserDto): Usuario {
    return Usuario.create({
      usu_nom: dto.usu_nom,
      ape_mat: dto.ape_mat,
      ape_pat: dto.ape_pat,
      dni: dto.dni,
      email: dto.email,
      celular: dto.celular,
      direccion: dto.direccion,
      genero: dto.genero,
      fec_nac: dto.fec_nac,
      id_sede: dto.id_sede,
      activo: true, // Por defecto activo
    });
  }

  /**
   * Actualiza una Entidad existente con los datos del UpdateUserDto
   */
  static fromUpdateDto(usuario: Usuario, dto: UpdateUserDto): Usuario {
    return Usuario.create({
      id_usuario: usuario.id_usuario,
      usu_nom: dto.usu_nom ?? usuario.usu_nom,
      ape_mat: dto.ape_mat ?? usuario.ape_mat,
      ape_pat: dto.ape_pat ?? usuario.ape_pat,
      dni: usuario.dni, // El DNI NO se actualiza
      email: dto.email ?? usuario.email,
      celular: dto.celular ?? usuario.celular,
      direccion: dto.direccion ?? usuario.direccion,
      genero: dto.genero ?? usuario.genero,
      fec_nac: dto.fec_nac ?? usuario.fec_nac,
      id_sede: dto.id_sede ?? usuario.id_sede,
      activo: usuario.activo,
    });
  }

  /**
   * Actualiza el estado activo de una Entidad
   */
  static withStatus(usuario: Usuario, activo: boolean): Usuario {
    return Usuario.create({
      id_usuario: usuario.id_usuario,
      usu_nom: usuario.usu_nom,
      ape_mat: usuario.ape_mat,
      ape_pat: usuario.ape_pat,
      dni: usuario.dni,
      email: usuario.email,
      celular: usuario.celular,
      direccion: usuario.direccion,
      genero: usuario.genero,
      fec_nac: usuario.fec_nac,
      id_sede: usuario.id_sede,
      activo: activo,
    });
  }

  /**
   * Crea un DTO de respuesta para usuario eliminado
   */
  static toDeletedResponse(id_usuario: number): UserDeletedResponseDto {
    return {
      id_usuario,
      message: 'Usuario eliminado exitosamente',
      deletedAt: new Date(),
    };
  }
}