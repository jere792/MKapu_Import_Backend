import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserQueryPort } from '../../domain/ports/in/user-port-in';
import { IUserRepositoryPort } from '../../domain/ports/out/user-port-out';
import { ListUserFilterDto } from '../dto/in';
import { UserResponseDto, UserListResponse } from '../dto/out';
import { UserMapper } from '../mapper/user.mapper';
import { UserWithAccountResponseDto } from '../dto/out/user-with-account-response.dto';

@Injectable()
export class UserQueryService implements IUserQueryPort {
  constructor(
    @Inject('IUserRepositoryPort')
    private readonly repository: IUserRepositoryPort,
    @Inject('IUserRepositoryPort')
    private readonly userRepository: IUserRepositoryPort,
  ) {}

  async listUsers(filters?: ListUserFilterDto): Promise<UserListResponse> {
    const usuarios = await this.repository.findAll(filters);
    return UserMapper.toListResponse(usuarios);
  }

  async getUserById(id: number): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findById(id);

    if (!usuario) {
      return null;
    }

    return UserMapper.toResponseDto(usuario);
  }

  async getUserByDni(dni: string): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findByDni(dni);

    if (!usuario) {
      return null;
    }

    return UserMapper.toResponseDto(usuario);
  }

  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    const usuario = await this.repository.findByEmail(email);

    if (!usuario) {
      return null;
    }
    return UserMapper.toResponseDto(usuario);
  }
  async getUserWithAccount(id: number): Promise<UserWithAccountResponseDto> {
    const result = await this.userRepository.findUserWithAccountById(id);
    if (!result) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return result;
  }
}
