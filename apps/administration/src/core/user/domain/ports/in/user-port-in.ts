// administration/src/core/user/domain/ports/in/user-port-in.ts

import {
  RegisterUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
  ListUserFilterDto,
  ListUserSalesFilterDto,
  ListUserQuotesFilterDto,
} from '../../../application/dto/in';
import { ChangeAccountCredentialsDto } from '../../../application/dto/in/change-account-credentials-dto';
import {
  UserResponseDto,
  UserListResponse,
  UserDeletedResponseDto,
  UserSalesResponseDto,
  UserQuotesResponseDto,
} from '../../../application/dto/out';
import { AccountCredentialsResponseDto } from '../../../application/dto/out/account-credentials-response.dto';
import { UserWithAccountResponseDto } from '../../../application/dto/out/user-with-account-response.dto';
import { UserSimpleResponseDto } from '../../../application/dto/out/user-simple-response.dto';

export interface IUserCommandPort {
  registerUser(dto: RegisterUserDto): Promise<UserResponseDto>;
  updateUser(dto: UpdateUserDto): Promise<UserResponseDto>;
  changeUserStatus(dto: ChangeUserStatusDto): Promise<UserResponseDto>;
  deleteUser(id: number): Promise<UserDeletedResponseDto>;
  changeCredentials(
    dto: ChangeAccountCredentialsDto,
  ): Promise<AccountCredentialsResponseDto>;
}

export interface IUserQueryPort {
  listUsers(filters?: ListUserFilterDto): Promise<UserListResponse>;
  getUserById(id: number): Promise<UserResponseDto | null>;
  getUserByDni(dni: string): Promise<UserResponseDto | null>;
  getUserByEmail(email: string): Promise<UserResponseDto | null>;
  getUserWithAccount(id: number): Promise<UserWithAccountResponseDto>;
  findByIds(ids: number[]): Promise<UserSimpleResponseDto[]>;
  getAllUsers(): Promise<UserResponseDto[]>;
  getUserSales(
    id: number,
    filters: ListUserSalesFilterDto,
  ): Promise<UserSalesResponseDto>;
  getUserQuotes(
    id: number,
    filters: ListUserQuotesFilterDto,
  ): Promise<UserQuotesResponseDto>;
  getAccountByUserId(id: number): Promise<AccountCredentialsResponseDto>;
}
