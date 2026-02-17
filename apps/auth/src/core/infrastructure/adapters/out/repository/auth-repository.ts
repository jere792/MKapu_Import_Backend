/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* auth/src/core/infrastructure/repository/auth-repository.ts */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { AccountUserPortsOut } from 'apps/auth/src/core/domain/ports/out/account-user-port-out';
import {
  AccountUserOrmEntity,
  UserOrmEntity,
} from '../../../entity/account-user-orm-entity';

import { AccountUser } from 'apps/auth/src/core/domain/entity/account-user';
import { AccountUserMapper } from 'apps/auth/src/core/application/mapper/AccountUserMapper';

@Injectable()
export class AuthRepository implements AccountUserPortsOut {
  private readonly userRepo: Repository<AccountUserOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepo = this.dataSource.getRepository(AccountUserOrmEntity);
  }

  async findAccountByUsernameWithRelations(
    username: string,
  ): Promise<AccountUserOrmEntity | null> {
    return await this.userRepo.findOne({
      where: { nom_usu: username, activo: true },
      relations: ['usuario', 'roles', 'roles.permisos'],
    });
  }

  async findByEmail(email: string): Promise<AccountUser | null> {
    const userEntity = await this.userRepo.findOne({
      where: { email_emp: email, activo: true },
      relations: ['usuario', 'roles'],
    });

    return userEntity ? AccountUserMapper.toDomainEntity(userEntity) : null;
  }

  async assignRole(accountId: number, roleId: number): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .relation(AccountUserOrmEntity, 'roles')
      .of(accountId)
      .add(roleId);
  }

  async findByUsername(username: string): Promise<AccountUser | null> {
    const userEntity = await this.userRepo.findOne({
      where: { nom_usu: username, activo: true },
      relations: ['usuario', 'roles'],
    });

    return userEntity ? AccountUserMapper.toDomainEntity(userEntity) : null;
  }

  async createAccount(data: {
    userId: number;
    username: string;
    password: string;
  }): Promise<AccountUser> {
    const newAccount = this.userRepo.create({
      nom_usu: data.username,
      contraseña: data.password,
      email_emp: `${data.username}@empresa.com`,
      id_sede: 1,
      activo: true,
      ultimo_acceso: new Date(),
    });

    const userRef = new UserOrmEntity();
    userRef.id_usuario = data.userId;

    newAccount.usuario = userRef;
    newAccount.id_usuario_val = data.userId;

    try {
      const savedAccount = await this.userRepo.save(newAccount);
      return AccountUserMapper.toDomainEntity(savedAccount);
    } catch (error) {
      if ((error as any).code === 'ER_DUP_ENTRY') {
        throw new Error('El username ya está en uso');
      }
      throw error;
    }
  }

  async findById(id: number): Promise<AccountUser | null> {
    const userEntity = await this.userRepo.findOne({
      where: { id_cuenta: id },
      relations: ['usuario', 'roles'],
    });

    return userEntity ? AccountUserMapper.toDomainEntity(userEntity) : null;
  }

  async updateLastAccess(accountId: number): Promise<void> {
    await this.userRepo.update(accountId, { ultimo_acceso: new Date() });
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const result = await this.userRepo.update(id, { contraseña: newPassword });
    if (result.affected === 0) throw new Error('Usuario no encontrado.');
  }

  async getPasswordById(id: number): Promise<string | null> {
    const user = await this.userRepo.findOne({
      where: { id_cuenta: id },
      select: ['contraseña'],
    });
    return user ? user.contraseña : null;
  }

  async getProfileData(id: number): Promise<any> {
    return await this.dataSource.query(
      `SELECT 
        u.id_usuario, 
        u.nombres as usu_nom, 
        u.ape_pat, 
        u.ape_mat,
        u.dni, 
        u.email, 
        u.celular, 
        u.direccion, 
        cu.nom_usu as username, 
        r.nombre as rol
       FROM usuario u
       INNER JOIN cuenta_usuario cu ON cu.id_usuario = u.id_usuario
       LEFT JOIN cuenta_rol cr ON cr.id_cuenta = cu.id_cuenta
       LEFT JOIN rol r ON cr.id_rol = r.id_rol
       WHERE u.id_usuario = ? AND u.activo = 1`,
      [id],
    );
  }
}