/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* ============================================
   administration/src/core/user/application/mapper/user.mapper.ts
   ============================================ */

import { Usuario } from '../../domain/entity/user-domain-entity';
import { UserOrmEntity } from '../../infrastructure/entity/user-orm.entity';
import { RegisterUserDto, UpdateUserDto } from '../dto/in';
import {
  UserResponseDto,
  UserListResponse,
  UserDeletedResponseDto,
} from '../dto/out';

export class UserMapper {
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
      genero: usuario.genero as 'M' | 'F',
      fec_nac: usuario.fec_nac,
      activo: usuario.activo,
      id_sede: usuario.id_sede,
      sedeNombre: usuario.sedeNombre,
      rolNombre: usuario.rolNombre,
    };
  }

  static toListResponse(usuarios: Usuario[]): UserListResponse {
    return {
      users: usuarios.map((user) => this.toResponseDto(user)),
      total: usuarios.length,
    };
  }

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
      activo: true,
    });
  }

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

  static toDeletedResponse(id_usuario: number): UserDeletedResponseDto {
    return {
      id_usuario,
      message: 'Usuario eliminado exitosamente',
      deletedAt: new Date(),
    };
  }
  static toDomainEntity(userOrm: UserOrmEntity): Usuario {
    return Usuario.create({
      id_usuario: userOrm.id_usuario,
      usu_nom: userOrm.nombres,
      ape_mat: userOrm.ape_mat,
      ape_pat: userOrm.ape_pat,
      dni: userOrm.dni,
      email: userOrm.email,
      celular: userOrm.celular,
      direccion: userOrm.direccion,
      genero: userOrm.genero,
      fec_nac: userOrm.fec_nac,
      activo: userOrm.activo,
      id_sede: userOrm.id_sede,
      sedeNombre: userOrm.sede?.nombre,
    });
  }
  static toOrmEntity(user: Usuario): UserOrmEntity {
    const userOrm = new UserOrmEntity();
    userOrm.id_usuario = user.id_usuario!;
    userOrm.nombres = user.usu_nom;
    userOrm.ape_mat = user.ape_mat;
    userOrm.ape_pat = user.ape_pat;
    userOrm.dni = user.dni;
    userOrm.email = user.email;
    userOrm.celular = user.celular;
    userOrm.direccion = user.direccion;
    userOrm.genero = user.genero;
    userOrm.fec_nac = user.fec_nac;
    userOrm.activo = user.activo;
    userOrm.id_sede = user.id_sede!;
    return userOrm;
  }
}
