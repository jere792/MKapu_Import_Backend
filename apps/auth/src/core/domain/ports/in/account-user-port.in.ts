/* auth/src/core/domain/ports/in/account-user-port.in.ts */
import { LoginDto } from '../../../application/dto/in/loginDto';
import { RegisterDto } from '../../../application/dto/in/registerDto';
import { LoginResponseDto } from '../../../application/dto/out/LoginResponseDto';

export interface AccountUserPortsIn {
  login(loginDto: LoginDto): Promise<LoginResponseDto | null>;
  register(
    nombreUsuario: string,
    contrasenia: string,
    email: string,
    id_rol: number,
    rolNombre: string,
  ): Promise<RegisterDto>;
}
