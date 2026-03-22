/* apps/administration/src/core/user/application/service/user-command.service.ts */

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { IUserCommandPort } from '../../domain/ports/in/user-port-in';
import { IUserRepositoryPort } from '../../domain/ports/out/user-port-out';
import { RegisterUserDto, UpdateUserDto, ChangeUserStatusDto } from '../dto/in';
import { ChangeAccountCredentialsDto } from '../dto/in/change-account-credentials-dto';
import { UserResponseDto, UserDeletedResponseDto } from '../dto/out';
import { AccountCredentialsResponseDto } from '../dto/out/account-credentials-response.dto';
import { UserMapper } from '../mapper/user.mapper';
import { UserWebSocketGateway } from '../../infrastructure/adapters/out/user-websocket.gateway';

import { CuentaUsuarioOrmEntity } from '../../infrastructure/entity/cuenta-usuario-orm.entity';
import { CuentaRolOrmEntity } from '../../infrastructure/entity/cuenta-rol-orm.entity';
import { RoleOrmEntity } from '../../../role/infrastructure/entity/role-orm.entity';

@Injectable()
export class UserCommandService implements IUserCommandPort {
  constructor(
    @Inject('IUserRepositoryPort')
    private readonly repository: IUserRepositoryPort,
    private readonly userGateway: UserWebSocketGateway,
    @InjectRepository(CuentaUsuarioOrmEntity)
    private readonly cuentaUsuarioRepo: Repository<CuentaUsuarioOrmEntity>,
    @InjectRepository(CuentaRolOrmEntity)
    private readonly cuentaRolRepo: Repository<CuentaRolOrmEntity>,
    @InjectRepository(RoleOrmEntity)
    private readonly roleRepo: Repository<RoleOrmEntity>,
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<UserResponseDto> {
    const [existsByDni, existsByEmail] = await Promise.all([
      this.repository.existsByDni(dto.dni),
      this.repository.existsByEmail(dto.email),
    ]);

    if (existsByDni)
      throw new ConflictException('Ya existe un usuario con ese DNI');
    if (existsByEmail)
      throw new ConflictException('Ya existe un usuario con ese email');

    const usuario = UserMapper.fromRegisterDto(dto);
    const savedUser = await this.repository.save(usuario);
    const response = UserMapper.toResponseDto(savedUser);

    this.userGateway.notifyUserCreated(response);
    return response;
  }

  async updateUser(dto: UpdateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.repository.findById(dto.id_usuario);
    if (!existingUser)
      throw new NotFoundException(`Usuario con ID ${dto.id_usuario} no encontrado`);

    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.repository.existsByEmail(dto.email);
      if (emailExists)
        throw new ConflictException('El email ya está en uso por otro usuario');
    }

    const updatedUser = UserMapper.fromUpdateDto(existingUser, dto);
    const savedUser = await this.repository.update(updatedUser);

    if (dto.rolNombre && dto.rolNombre !== existingUser.rolNombre) {
      const [role, cuenta] = await Promise.all([
        this.roleRepo.findOne({ where: { nombre: dto.rolNombre } }),
        this.cuentaUsuarioRepo.findOne({ where: { id_usuario: dto.id_usuario } }),
      ]);

      if (role && cuenta) {
        await this.cuentaRolRepo.update(
          { id_cuenta: cuenta.id_cuenta },
          { id_rol: role.id_rol },
        );
      }
    }

    const response = UserMapper.toResponseDto(savedUser);
    this.userGateway.notifyUserUpdated(response);
    return response;
  }

  async changeUserStatus(dto: ChangeUserStatusDto): Promise<UserResponseDto> {
    const existingUser = await this.repository.findById(dto.id_usuario);
    if (!existingUser)
      throw new NotFoundException(`Usuario con ID ${dto.id_usuario} no encontrado`);

    const updatedUser = UserMapper.withStatus(existingUser, dto.activo);
    const savedUser = await this.repository.update(updatedUser);
    const response = UserMapper.toResponseDto(savedUser);

    this.userGateway.notifyUserStatusChanged(response);
    return response;
  }

  async deleteUser(id: number): Promise<UserDeletedResponseDto> {
    const existingUser = await this.repository.findById(id);
    if (!existingUser)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    await this.repository.delete(id);
    const response = UserMapper.toDeletedResponse(id);

    this.userGateway.notifyUserDeleted(id);
    return response;
  }

  async changeCredentials(dto: ChangeAccountCredentialsDto): Promise<AccountCredentialsResponseDto> {
    if (!dto.nom_usu && !dto.nueva_contraseña) {
      throw new BadRequestException(
        'Debes enviar al menos "nom_usu" o "nueva_contraseña" para actualizar',
      );
    }

    const cuenta = await this.cuentaUsuarioRepo.findOne({
      where: { id_usuario: dto.id_usuario },
    });

    if (!cuenta) {
      throw new NotFoundException(
        `No existe una cuenta de acceso para el usuario con ID ${dto.id_usuario}`,
      );
    }

    const updateData: Partial<CuentaUsuarioOrmEntity> = {};
    if (dto.nom_usu?.trim())          updateData.nom_usu    = dto.nom_usu.trim();
    if (dto.nueva_contraseña?.trim()) updateData.contraseña = await bcrypt.hash(dto.nueva_contraseña.trim(), 10);

    await this.cuentaUsuarioRepo.update(
      { id_usuario: dto.id_usuario },
      updateData,
    );

    return {
      id_cuenta:  cuenta.id_cuenta,
      id_usuario: cuenta.id_usuario,
      nom_usu:    updateData.nom_usu ?? cuenta.nom_usu,
      email_emp:  cuenta.email_emp,
      updatedAt:  new Date(),
      message:    'Credenciales actualizadas correctamente',
    };
  }
}