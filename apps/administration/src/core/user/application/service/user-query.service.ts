/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* ============================================
   administration/src/core/user/application/service/user-query.service.ts
   ============================================ */

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserQueryPort } from '../../domain/ports/in/user-port-in';
import { IUserRepositoryPort } from '../../domain/ports/out/user-port-out';
import { ListUserFilterDto, ListUserSalesFilterDto } from '../dto/in';
import {
  UserResponseDto,
  UserListResponse,
  UserSalesResponseDto,
} from '../dto/out';
import { UserMapper } from '../mapper/user.mapper';
import { UserWithAccountResponseDto } from '../dto/out/user-with-account-response.dto';
import { UserSimpleResponseDto } from '../dto/out/user-simple-response.dto';
import { CuentaUsuarioOrmEntity } from '../../infrastructure/entity/cuenta-usuario-orm.entity';
import { AccountCredentialsResponseDto } from '../dto/out/account-credentials-response.dto';
import { SalesTcpProxy } from '../../infrastructure/adapters/out/TCP/sales-tcp.proxy';

@Injectable()
export class UserQueryService implements IUserQueryPort {
  constructor(
    @Inject('IUserRepositoryPort')
    private readonly repository: IUserRepositoryPort,
    @InjectRepository(CuentaUsuarioOrmEntity)
    private readonly cuentaRepo: Repository<CuentaUsuarioOrmEntity>,
    private readonly salesTcpProxy: SalesTcpProxy,
  ) {}

  async listUsers(filters?: ListUserFilterDto): Promise<UserListResponse> {
    const usuarios = await this.repository.findAll(filters);
    return UserMapper.toListResponse(usuarios);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const usuarios = await this.repository.findAll();
    return usuarios.map((u) => UserMapper.toResponseDto(u));
  }

  async getUserById(id: number): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findById(id);
    if (!usuario) return null;
    return UserMapper.toResponseDto(usuario);
  }

  async getUserByDni(dni: string): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findByDni(dni);
    if (!usuario) return null;
    return UserMapper.toResponseDto(usuario);
  }

  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findByEmail(email);
    if (!usuario) return null;
    return UserMapper.toResponseDto(usuario);
  }

  async getUserWithAccount(id: number): Promise<UserWithAccountResponseDto> {
    const result = await this.repository.findUserWithAccountById(id);
    if (!result) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return result;
  }

  async findByIds(ids: number[]): Promise<UserSimpleResponseDto[]> {
    if (!ids || ids.length === 0) return [];
    const users = await (this.repository as any).findByIds(ids);
    return (users || []).map((u: any) => ({
      id_usuario: u.id_usuario,
      nombres: u.nombres,
      ape_pat: u.ape_pat,
      ape_mat: u.ape_mat,
      nombreCompleto:
        `${u.nombres ?? ''} ${u.ape_pat ?? ''} ${u.ape_mat ?? ''}`.trim(),
    }));
  }

  async getUserSales(
    id: number,
    filters: ListUserSalesFilterDto,
  ): Promise<UserSalesResponseDto> {
    const usuario = await this.repository.findById(id);

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return this.salesTcpProxy.getUserSales(id, filters);
  }

  /**
   * Devuelve los datos actuales de la cuenta (nom_usu, email_emp).
   * Útil para pre-poblar el formulario de edición de credenciales.
   */
  async getAccountByUserId(
    id_usuario: number,
  ): Promise<AccountCredentialsResponseDto> {
    const cuenta = await this.cuentaRepo.findOne({ where: { id_usuario } });

    if (!cuenta) {
      throw new NotFoundException(
        `No existe una cuenta de acceso para el usuario con ID ${id_usuario}`,
      );
    }

    return {
      id_cuenta: cuenta.id_cuenta,
      id_usuario: cuenta.id_usuario,
      nom_usu: cuenta.nom_usu,
      email_emp: cuenta.email_emp,
      updatedAt: new Date(),
      message: 'Cuenta encontrada',
    };
  }
}
