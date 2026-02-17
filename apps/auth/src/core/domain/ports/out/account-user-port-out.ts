import { AccountUser } from '../../entity/account-user';
import { AccountUserOrmEntity } from '../../../infrastructure/entity/account-user-orm-entity';

export interface AccountUserPortsOut {
  findByUsername(username: string): Promise<AccountUser | null>;

  findAccountByUsernameWithRelations(username: string): Promise<AccountUserOrmEntity | null>;

  createAccount(data: { userId: number; username: string; password: string }): Promise<AccountUser>;
  updateLastAccess(accountId: number): Promise<void>;
  updatePassword(id: number, newPassword: string): Promise<void>;
  getProfileData(id: number): Promise<any>;
  getPasswordById(id: number): Promise<string | null>;
  findById(id: number): Promise<AccountUser | null>;
  findByEmail(email: string): Promise<AccountUser | null>;
  assignRole(accountId: number, roleId: number): Promise<void>;
}