/* auth/src/core/domain/ports/in/account-user-port.in.ts */
import { LoginDto } from '../../../application/dto/in/loginDto';
import { LoginResponseDto } from '../../../application/dto/out/LoginResponseDto';

export interface AccountUserPortsIn {
  login(loginDto: LoginDto): Promise<LoginResponseDto | null>;
  createAccountForUser(
    userId: number,
    username: string,
    passwordRaw: string,
  ): Promise<any>;
}
