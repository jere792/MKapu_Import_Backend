/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* ============================================
   administration/src/core/role/infrastructure/repository/role.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepositoryPort } from '../../domain/ports/out/role-port-out';
import { Role } from '../../domain/entity/role-domain-entity';
import { RoleOrmEntity } from '../entity/role-orm.entity';

@Injectable()
export class RoleRepository implements IRoleRepositoryPort {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly roleOrmRepository: Repository<RoleOrmEntity>,
  ) {}

  async save(role: Role): Promise<Role> {
    const roleOrm = this.toOrmEntity(role);
    const saved = await this.roleOrmRepository.save(roleOrm);
    return this.toDomainEntity(saved);
  }

  async update(role: Role): Promise<Role> {
    const roleOrm = this.toOrmEntity(role);
    await this.roleOrmRepository.update(role.id_rol!, roleOrm);
    const updated = await this.roleOrmRepository.findOne({
      where: { id_rol: role.id_rol },
    });
    return this.toDomainEntity(updated!);
  }

  async delete(id: number): Promise<void> {
    await this.roleOrmRepository.delete(id);
  }

  async findById(id: number): Promise<Role | null> {
    const roleOrm = await this.roleOrmRepository.findOne({
      where: { id_rol: id },
    });
    return roleOrm ? this.toDomainEntity(roleOrm) : null;
  }

  async findByName(nombre: string): Promise<Role | null> {
    const roleOrm = await this.roleOrmRepository.findOne({
      where: { nombre },
    });
    return roleOrm ? this.toDomainEntity(roleOrm) : null;
  }

  async findAll(filters?: {
    activo?: boolean;
    search?: string;
  }): Promise<Role[]> {
    const queryBuilder = this.roleOrmRepository.createQueryBuilder('rol');

    if (filters?.activo !== undefined) {
      queryBuilder.andWhere('rol.activo = :activo', {
        activo: filters.activo ? 1 : 0,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(rol.nombre LIKE :search OR rol.descripcion LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const rolesOrm = await queryBuilder.getMany();
    return rolesOrm.map((roleOrm) => this.toDomainEntity(roleOrm));
  }

  async existsByName(nombre: string): Promise<boolean> {
    const count = await this.roleOrmRepository.count({ where: { nombre } });
    return count > 0;
  }

  private toDomainEntity(roleOrm: RoleOrmEntity): Role {
    return Role.create({
      id_rol: roleOrm.id_rol,
      nombre: roleOrm.nombre,
      descripcion: roleOrm.descripcion,
      activo: roleOrm.activo,
    });
  }

  private toOrmEntity(role: Role): RoleOrmEntity {
    const roleOrm = new RoleOrmEntity();
    roleOrm.id_rol = role.id_rol!;
    roleOrm.nombre = role.nombre;
    roleOrm.descripcion = role.descripcion!;
    roleOrm.activo = role.activo;
    return roleOrm;
  }
}
