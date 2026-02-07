/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* ============================================
   administration/src/core/role/application/service/role-command.service.ts
   ============================================ */

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IRoleCommandPort } from '../../domain/ports/in/role-port-in';
import { IRoleRepositoryPort } from '../../domain/ports/out/role-port-out';
import { RegisterRoleDto, UpdateRoleDto, ChangeRoleStatusDto } from '../dto/in';
import { RoleResponseDto, RoleDeletedResponseDto } from '../dto/out';
import { RoleMapper } from '../mapper/role.mapper';

@Injectable()
export class RoleCommandService implements IRoleCommandPort {
  constructor(
    @Inject('IRoleRepositoryPort')
    private readonly repository: IRoleRepositoryPort,
  ) {}

  async registerRole(dto: RegisterRoleDto): Promise<RoleResponseDto> {
    const existsByName = await this.repository.existsByName(dto.nombre);
    if (existsByName) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    const role = RoleMapper.fromRegisterDto(dto);
    const savedRole = await this.repository.save(role);
    return RoleMapper.toResponseDto(savedRole);
  }

  async updateRole(dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const existingRole = await this.repository.findById(dto.id_rol);
    if (!existingRole) {
      throw new NotFoundException(`Rol con ID ${dto.id_rol} no encontrado`);
    }

    if (dto.nombre && dto.nombre !== existingRole.nombre) {
      const nameExists = await this.repository.existsByName(dto.nombre);
      if (nameExists) {
        throw new ConflictException('El nombre ya está en uso por otro rol');
      }
    }

    const updatedRole = RoleMapper.fromUpdateDto(existingRole, dto);
    const savedRole = await this.repository.update(updatedRole);
    return RoleMapper.toResponseDto(savedRole);
  }

  async changeRoleStatus(dto: ChangeRoleStatusDto): Promise<RoleResponseDto> {
    const existingRole = await this.repository.findById(dto.id_rol);
    if (!existingRole) {
      throw new NotFoundException(`Rol con ID ${dto.id_rol} no encontrado`);
    }

    const updatedRole = RoleMapper.withStatus(existingRole, dto.activo);
    const savedRole = await this.repository.update(updatedRole);
    return RoleMapper.toResponseDto(savedRole);
  }

  async deleteRole(id: number): Promise<RoleDeletedResponseDto> {
    const existingRole = await this.repository.findById(id);
    if (!existingRole) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    await this.repository.delete(id);
    return RoleMapper.toDeletedResponse(id);
  }

  async getAllRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.repository.findAll();
    return roles.map(RoleMapper.toResponseDto);
  }
}
