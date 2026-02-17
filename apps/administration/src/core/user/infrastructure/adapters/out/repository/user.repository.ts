/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* ============================================
   administration/src/core/user/infrastructure/repository/user.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IUserRepositoryPort } from '../../../../domain/ports/out/user-port-out';
import { UserOrmEntity } from '../../../entity/user-orm.entity';
import { Usuario } from '../../../../domain/entity/user-domain-entity';
import { UserMapper } from '../../../../application/mapper/user.mapper';
import { UserWithAccountResponseDto } from '../../../../application/dto/out/user-with-account-response.dto';
import { HeadquartersOrmEntity } from 'apps/administration/src/core/headquarters/infrastructure/entity/headquarters-orm.entity';

@Injectable()
export class UserRepository implements IUserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userOrmRepository: Repository<UserOrmEntity>,
  ) {}

  async save(user: Usuario): Promise<Usuario> {
    const userOrm = UserMapper.toOrmEntity(user);
    const saved = await this.userOrmRepository.save(userOrm);
    if (saved.id_sede) {
      const sede = await this.findSedeById(saved.id_sede);
      if (sede) {
        saved.sede = sede;
      }
    }
    return UserMapper.toDomainEntity(saved);
  }

  async findSedeById(idSede: number): Promise<HeadquartersOrmEntity | null> {
    return await this.userOrmRepository.manager.findOne(HeadquartersOrmEntity, {
      where: { id_sede: idSede },
      select: ['id_sede', 'nombre'],
    });
  }

  async update(user: Usuario): Promise<Usuario> {
    const userOrm = UserMapper.toOrmEntity(user);
    await this.userOrmRepository.update(user.id_usuario!, userOrm);
    const updated = await this.findById(user.id_usuario!);
    return updated!;
  }

  async delete(id: number): Promise<void> {
    await this.userOrmRepository.delete(id);
  }

  async findById(id: number): Promise<Usuario | null> {
    const queryBuilder = this.userOrmRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sede', 'sede')
      .leftJoin('cuenta_usuario', 'cu', 'cu.id_usuario = usuario.id_usuario')
      .leftJoin('cuenta_rol', 'cr', 'cr.id_cuenta = cu.id_cuenta')
      .leftJoin('rol', 'r', 'r.id_rol = cr.id_rol')
      .addSelect('r.nombre', 'roleName') 
      .where('usuario.id_usuario = :id', { id });

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    if (!entities.length) return null;

    const userDomain = UserMapper.toDomainEntity(entities[0]);

    // 'sede' ya viene mapeado por TypeORM en entities[0]
    if (entities[0].sede) {
      userDomain.sedeNombre = entities[0].sede.nombre;
    }

    // Buscar el nombre del rol en raw: intentamos varias claves por compatibilidad
    const rawRow = raw[0] ?? {};
    const roleName =
      rawRow.roleName ??
      rawRow.rolNombre ??
      rawRow.r_roleName ??
      rawRow.r_rolNombre ??
      Object.values(rawRow).find((v) => typeof v === 'string' && v === v) ??
      null;

    userDomain.rolNombre = roleName ? String(roleName) : 'SIN_ROL';

    return userDomain;
  }

  async findByDni(dni: string): Promise<Usuario | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { dni },
      relations: ['sede'],
    });

    return userOrm ? UserMapper.toDomainEntity(userOrm) : null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { email },
      relations: ['sede'],
    });

    return userOrm ? UserMapper.toDomainEntity(userOrm) : null;
  }

  async findAll(filters?: {
    activo?: boolean;
    search?: string;
    id_sede?: number;
    genero?: 'M' | 'F';
  }): Promise<Usuario[]> {
    const queryBuilder = this.userOrmRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sede', 'sede')
      // --- JOINS MANUALES (1:1 con cuenta_usuario) ---
      .leftJoin('cuenta_usuario', 'cu', 'cu.id_usuario = usuario.id_usuario')
      .leftJoin('cuenta_rol', 'cr', 'cr.id_cuenta = cu.id_cuenta')
      .leftJoin('rol', 'r', 'r.id_rol = cr.id_rol')
      .addSelect('r.nombre', 'roleName');

    if (filters?.activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', {
        activo: filters.activo ? 1 : 0,
      });
    }

    if (filters?.id_sede) {
      queryBuilder.andWhere('usuario.id_sede = :id_sede', {
        id_sede: filters.id_sede,
      });
    }

    if (filters?.genero) {
      queryBuilder.andWhere('usuario.genero = :genero', {
        genero: filters.genero,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(usuario.nombres LIKE :search OR usuario.ape_pat LIKE :search OR usuario.ape_mat LIKE :search OR usuario.dni LIKE :search OR usuario.email LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((userOrm) => {
      const domain = UserMapper.toDomainEntity(userOrm);

      if (userOrm.sede) {
        domain.sedeNombre = userOrm.sede.nombre;
      }

      // raw rows may have different column keys depending on driver/aliasing.
      // Try several possibilities to extract roleName.
      const rawRow = raw.find((r) => {
        // attempt to match row to entity by id field variations
        return (
          r.usuario_id_usuario === userOrm.id_usuario ||
          r.usuario_id === userOrm.id_usuario ||
          r.id_usuario === userOrm.id_usuario ||
          r['usuario_idUsuario'] === userOrm.id_usuario
        );
      }) || {};

      const roleName =
        rawRow.roleName ??
        rawRow.rolNombre ??
        rawRow.r_roleName ??
        rawRow.r_rolNombre ??
        null;

      domain.rolNombre = roleName ? String(roleName) : 'SIN_ROL';

      return domain;
    });
  }

  async existsByDni(dni: string): Promise<boolean> {
    const count = await this.userOrmRepository.count({ where: { dni } });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userOrmRepository.count({ where: { email } });
    return count > 0;
  }

  async findUserWithAccountById(
    id: number,
  ): Promise<UserWithAccountResponseDto | null> {
    const queryBuilder = this.userOrmRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sede', 'sede')
      .leftJoin('cuenta_usuario', 'cu', 'cu.id_usuario = usuario.id_usuario')
      .leftJoin('cuenta_rol', 'cr', 'cr.id_cuenta = cu.id_cuenta')
      .leftJoin('rol', 'r', 'r.id_rol = cr.id_rol')
      .addSelect('cu.id_cuenta', 'accountId')
      .addSelect('cu.nom_usu', 'accountUser')
      .addSelect('cu.email_emp', 'accountEmail')
      .addSelect('cu.activo', 'accountActive')
      .addSelect('cu.ultimo_acceso', 'accountLastAccess')
      .addSelect('r.nombre', 'roleName')
      .where('usuario.id_usuario = :id', { id });

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    if (!entities.length) return null;

    const userEntity = entities[0];
    const rawData = raw[0] || {};

    // 1. Mapear Usuario (Dominio y DTO)
    const userDomain = UserMapper.toDomainEntity(userEntity);
    if (userEntity.sede) {
      userDomain.sedeNombre = userEntity.sede.nombre;
    }
    // Usamos el alias 'roleName' que definimos arriba
    userDomain.rolNombre =
      rawData && (rawData.roleName ?? rawData.rolNombre)
        ? (rawData.roleName ?? rawData.rolNombre)
        : 'SIN_ROL';

    const userDto = UserMapper.toResponseDto(userDomain);

    // 2. Mapear Cuenta (Raw -> DTO)
    let accountDto = null;

    if (rawData && rawData.accountId) {
      let isActive = false;
      const rawActive = rawData.accountActive;

      if (rawActive === true || rawActive === 1) {
        isActive = true;
      } else if (
        typeof rawActive === 'object' &&
        rawActive !== null &&
        rawActive[0] === 1
      ) {
        // Caso Buffer de MySQL
        isActive = true;
      }

      accountDto = {
        id_cuenta: rawData.accountId,
        nom_usu: rawData.accountUser,
        email_emp: rawData.accountEmail,
        activo: isActive,
        ultimo_acceso: rawData.accountLastAccess,
        rolNombre: rawData.roleName ?? rawData.rolNombre ?? 'SIN_ROL',
      };
    }

    return {
      usuario: userDto,
      cuenta_usuario: accountDto,
    };
  }

  // Nuevo: encontrar usuarios por ids (devuelve entidades ORM)
  async findByIds(ids: number[]): Promise<UserOrmEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.userOrmRepository.find({
      where: { id_usuario: In(ids) },
      select: ['id_usuario', 'nombres', 'ape_pat', 'ape_mat'],
    });
  }
}