import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserCommandPort } from '../../domain/ports/in/user-port-in';
import { IUserRepositoryPort } from '../../domain/ports/out/user-port-out';
import { RegisterUserDto, UpdateUserDto, ChangeUserStatusDto } from '../dto/in';
import { UserResponseDto, UserDeletedResponseDto } from '../dto/out';
import { UserMapper } from '../mapper/user.mapper';
import { UserWebSocketGateway } from '../../infrastructure/adapters/out/user-websocket.gateway';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Importa las entidades infra necesarias
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
    private readonly roleRepo: Repository<RoleOrmEntity>
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<UserResponseDto> {
    const existsByDni = await this.repository.existsByDni(dto.dni);
    if (existsByDni)
      throw new ConflictException('Ya existe un usuario con ese DNI');

    const existsByEmail = await this.repository.existsByEmail(dto.email);
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
      throw new NotFoundException(
        `Usuario con ID ${dto.id_usuario} no encontrado`,
      );

    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.repository.existsByEmail(dto.email);
      if (emailExists)
        throw new ConflictException('El email ya está en uso por otro usuario');
    }

    const updatedUser = UserMapper.fromUpdateDto(existingUser, dto);
    const savedUser = await this.repository.update(updatedUser);

    if (dto.rolNombre && dto.rolNombre !== existingUser.rolNombre) {
      const role = await this.roleRepo.findOne({ where: { nombre: dto.rolNombre } });
      if (role) {
        // 2. Busca cuenta del usuario
        const cuenta = await this.cuentaUsuarioRepo.findOne({ where: { id_usuario: dto.id_usuario } });
        if (cuenta) {
          // 3. Actualiza el rol en cuenta_rol
          await this.cuentaRolRepo.update(
            { id_cuenta: cuenta.id_cuenta },
            { id_rol: role.id_rol }
          );
        }
      }
    }

    // Luego retorna el usuario actualizado
    const response = UserMapper.toResponseDto(
      await this.repository.findById(dto.id_usuario)!
    );
    this.userGateway.notifyUserUpdated(response);

    return response;
  }

  async changeUserStatus(dto: ChangeUserStatusDto): Promise<UserResponseDto> {
    const existingUser = await this.repository.findById(dto.id_usuario);
    if (!existingUser)
      throw new NotFoundException(
        `Usuario con ID ${dto.id_usuario} no encontrado`,
      );

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
}