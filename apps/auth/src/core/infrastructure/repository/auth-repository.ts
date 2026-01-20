/* auth/src/core/infrastructure/repository/auth-repository.ts */

/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { AccountUserPortsOut } from '../../domain/ports/out/account-user-port-out';
import { DataSource, Repository } from 'typeorm';
import { AccountUserOrmEntity } from '../entity/account-user-orm-entity';
import { AccountUserMapper } from '../../application/mapper/AccountUserMapper';
import { RegisterDto } from '../../application/dto/in/registerDto';
import { v4 as uuidv4 } from 'uuid';
import { AccountUserResponseDto } from '../../application/dto/out/AccountUserResponseDto';

@Injectable()
export class AuthRepository implements AccountUserPortsOut {
  private readonly userRepo: Repository<AccountUserOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepo = this.dataSource.getRepository(AccountUserOrmEntity);
  }

  async findByUsername(username: string): Promise<AccountUserResponseDto | null> {
    const rawUser = await this.dataSource
      .createQueryBuilder()
      .select('cu.*, r.nombre as rol_nombre')
      .from('cuenta_usuario', 'cu')
      .innerJoin('roles', 'r', 'cu.rol_id = r.id')
      .where('cu.username = :username', { username })
      .getRawOne();

    return rawUser ? AccountUserMapper.toAccountUserResponseDto(rawUser) : null;
  }

  async createAccount(data: RegisterDto): Promise<RegisterDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newAccountId = uuidv4();
      await queryRunner.query(
        `INSERT INTO cuenta_usuario (
          id_cuenta, username, password, email_emp, id_usuario, id_sede, rol_id, ultimo_acceso, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'ACTIVO')`,
        [
          newAccountId,
          data.nombreUsuario,
          data.contrasenia,
          data.email,
          data.id_usuario || null,
          data.id_sede,
          data.id_rol,
        ],
      );

      /*await queryRunner.query(
        `INSERT INTO cuenta_rol (id_cuenta, id_rol) VALUES (?, ?)`,
        [newAccountId, data.id_rol],
      );*/

      await queryRunner.commitTransaction();
      return data;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateLastAccess(accountId: string): Promise<void> {
    await this.userRepo.update(accountId, { ultimo_acceso: new Date() });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const result = await this.userRepo.update(id, { password: newPassword });
    if (result.affected === 0) throw new Error('Usuario no encontrado.');
  }

  // OJO: Este método parece buscar datos del PERFIL (tabla usuarios antigua).
  // Si 'id' aquí se refiere al ID numérico del empleado, déjalo como number.
  // Si se refiere al ID de la cuenta, debe ser string. asumo que es ID de perfil:
  async getProfileData(id: number): Promise<any> {
    return await this.dataSource.query(
      `SELECT u.id, u.nombre_completo, u.dni, u.email, u.telefono, 
              u.direccion, cu.username, cu.ultimo_acceso, r.nombre as rol
       FROM usuarios u
       LEFT JOIN cuenta_usuario cu ON cu.id_usuario = u.id -- Unimos con la cuenta
       LEFT JOIN roles r ON cu.rol_id = r.id
       WHERE u.id = ? AND u.activo = 1`,
      [id],
    );
  }

  async getPasswordById(id: string): Promise<string | null> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['password'],
    });
    return user ? user.password : null;
  }

  async findById(id: string): Promise<AccountUserResponseDto | null> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['rol'],
    });
    return user ? AccountUserMapper.toAccountUserResponseDto(user) : null;
  }
}
