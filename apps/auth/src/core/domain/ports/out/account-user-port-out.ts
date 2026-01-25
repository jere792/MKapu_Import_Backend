/* auth/src/core/domain/ports/out/account-user-port-out.ts */
import { AccountUser } from '../../entity/account-user';

export interface AccountUserPortsOut {
  findByUsername(username: string): Promise<AccountUser | null>;

  createAccount(data: {
    userId: number;
    username: string;
    password: string;
  }): Promise<AccountUser>;

  updateLastAccess(accountId: number): Promise<void>;

  updatePassword(id: number, newPassword: string): Promise<void>;

  getProfileData(id: number): Promise<any>;
  getPasswordById(id: number): Promise<string | null>;

  findById(id: number): Promise<AccountUser | null>;
  findByEmail(email: string): Promise<AccountUser | null>;
  assignRole(accountId: number, roleId: number): Promise<void>;
}
