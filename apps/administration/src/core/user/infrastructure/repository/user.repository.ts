/* ============================================
   administration/src/core/user/infrastructure/repository/user.repository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IUserRepositoryPort } from '../../domain/ports/out/user-port-out';
import { Usuario } from '../../domain/entity/user-domain-entity';
import { UserOrmEntity } from '../entity/user-orm.entity';

@Injectable()
export class UserRepository implements IUserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userOrmRepository: Repository<UserOrmEntity>,
  ) {}

  /**
   * Guardar nuevo usuario
   */
  async save(user: Usuario): Promise<Usuario> {
    const userOrm = this.toOrmEntity(user);
    const saved = await this.userOrmRepository.save(userOrm);
    return this.toDomainEntity(saved);
  }

  /**
   * Actualizar usuario existente
   */
  async update(user: Usuario): Promise<Usuario> {
    const userOrm = this.toOrmEntity(user);
    await this.userOrmRepository.update(user.id_usuario!, userOrm);
    const updated = await this.userOrmRepository.findOne({
      where: { id_usuario: user.id_usuario },
      relations: ['sede'],
    });
    return this.toDomainEntity(updated!);
  }

  /**
   * Eliminar usuario por ID
   */
  async delete(id: number): Promise<void> {
    await this.userOrmRepository.delete(id);
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: number): Promise<Usuario | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { id_usuario: id },
      relations: ['sede'],
    });

    return userOrm ? this.toDomainEntity(userOrm) : null;
  }

  /**
   * Buscar usuario por DNI
   */
  async findByDni(dni: string): Promise<Usuario | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { dni },
      relations: ['sede'],
    });

    return userOrm ? this.toDomainEntity(userOrm) : null;
  }

  /**
   * Buscar usuario por Email
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    const userOrm = await this.userOrmRepository.findOne({
      where: { email },
      relations: ['sede'],
    });

    return userOrm ? this.toDomainEntity(userOrm) : null;
  }

  /**
   * Listar todos los usuarios con filtros
   */
  async findAll(filters?: {
    activo?: boolean;
    search?: string;
    id_sede?: number;
    genero?: 'M' | 'F';
  }): Promise<Usuario[]> {
    const queryBuilder = this.userOrmRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.sede', 'sede');

    // Filtro por estado activo
    if (filters?.activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', {
        activo: filters.activo ? 1 : 0,
      });
    }

    // Filtro por sede
    if (filters?.id_sede) {
      queryBuilder.andWhere('usuario.id_sede = :id_sede', {
        id_sede: filters.id_sede,
      });
    }

    // Filtro por género
    if (filters?.genero) {
      queryBuilder.andWhere('usuario.genero = :genero', {
        genero: filters.genero,
      });
    }

    // Búsqueda por nombre, DNI o email
    if (filters?.search) {
      queryBuilder.andWhere(
        '(usuario.usu_nom LIKE :search OR usuario.ape_pat LIKE :search OR usuario.ape_mat LIKE :search OR usuario.dni LIKE :search OR usuario.email LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const usersOrm = await queryBuilder.getMany();
    return usersOrm.map((userOrm) => this.toDomainEntity(userOrm));
  }

  /**
   * Verificar si existe usuario con DNI
   */
  async existsByDni(dni: string): Promise<boolean> {
    const count = await this.userOrmRepository.count({ where: { dni } });
    return count > 0;
  }

  /**
   * Verificar si existe usuario con Email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userOrmRepository.count({ where: { email } });
    return count > 0;
  }

  /**
   * Convierte de ORM Entity a Domain Entity
   */
  private toDomainEntity(userOrm: UserOrmEntity): Usuario {
    return Usuario.create({
      id_usuario: userOrm.id_usuario,
      usu_nom: userOrm.usu_nom,
      ape_mat: userOrm.ape_mat,
      ape_pat: userOrm.ape_pat,
      dni: userOrm.dni,
      email: userOrm.email,
      celular: userOrm.celular,
      direccion: userOrm.direccion,
      genero: userOrm.genero,
      fec_nac: userOrm.fec_nac,
      activo: userOrm.activo === 1,
      id_sede: userOrm.id_sede,
      sedeNombre: userOrm.sede?.nombre, // Si existe la relación
    });
  }

  /**
   * Convierte de Domain Entity a ORM Entity
   */
  private toOrmEntity(user: Usuario): UserOrmEntity {
    const userOrm = new UserOrmEntity();
    userOrm.id_usuario = user.id_usuario!;
    userOrm.usu_nom = user.usu_nom;
    userOrm.ape_mat = user.ape_mat;
    userOrm.ape_pat = user.ape_pat;
    userOrm.dni = user.dni;
    userOrm.email = user.email;
    userOrm.celular = user.celular;
    userOrm.direccion = user.direccion;
    userOrm.genero = user.genero;
    userOrm.fec_nac = user.fec_nac;
    userOrm.activo = user.activo ? 1 : 0;
    userOrm.id_sede = user.id_sede!;
    return userOrm;
  }
}
