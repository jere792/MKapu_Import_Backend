/* auth/src/core/domain/ports/out/account-user-port-out.ts */
import { RegisterDto } from '../../../application/dto/in/registerDto';
import { AccountUserResponseDto } from '../../../application/dto/out/AccountUserResponseDto';

export interface AccountUserPortsOut {
  findByUsername(username: string): Promise<AccountUserResponseDto | null>;
  createAccount(data: any): Promise<RegisterDto>;
  updateLastAccess(userId: string): Promise<void>;
  updatePassword(id: string, newPassword: string): Promise<void>;
  getProfileData(id: number): Promise<any>;
  getPasswordById(id: string): Promise<string | null>;
  findById(id: string): Promise<AccountUserResponseDto | null>;
}
