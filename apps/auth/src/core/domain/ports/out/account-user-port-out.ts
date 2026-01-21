/* auth/src/core/domain/ports/out/account-user-port-out.ts */
import { AccountUserResponseDto } from '../../../application/dto/out/AccountUserResponseDto';

export interface AccountUserPortsOut {
  findByUsername(username: string): Promise<AccountUserResponseDto | null>;

  createAccount(data: {
    userId: number;
    username: string;
    password: string;
  }): Promise<void>;

  updateLastAccess(accountId: string): Promise<void>;

  updatePassword(id: string, newPassword: string): Promise<void>;

  getProfileData(id: string): Promise<any>;

  getPasswordById(id: string): Promise<string | null>;

  findById(id: string): Promise<AccountUserResponseDto | null>;
}
