import {
  RegisterUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
  ListUserFilterDto,
} from '../../../application/dto/in';

import {
  UserResponseDto,
  UserListResponse,
  UserDeletedResponseDto,
} from '../../../application/dto/out';
import { UserWithAccountResponseDto } from '../../../application/dto/out/user-with-account-response.dto';
import { UserSimpleResponseDto } from '../../../application/dto/out/user-simple-response.dto'; 

export interface IUserCommandPort {
  registerUser(dto: RegisterUserDto): Promise<UserResponseDto>;
  updateUser(dto: UpdateUserDto): Promise<UserResponseDto>;
  changeUserStatus(dto: ChangeUserStatusDto): Promise<UserResponseDto>;
  deleteUser(id: number): Promise<UserDeletedResponseDto>;
}

export interface IUserQueryPort {
  listUsers(filters?: ListUserFilterDto): Promise<UserListResponse>;
  getUserById(id: number): Promise<UserResponseDto | null>;
  getUserByDni(dni: string): Promise<UserResponseDto | null>;
  getUserByEmail(email: string): Promise<UserResponseDto | null>;
  getUserWithAccount(id: number): Promise<UserWithAccountResponseDto>;

  findByIds?(ids: number[]): Promise<UserSimpleResponseDto[]>;
}